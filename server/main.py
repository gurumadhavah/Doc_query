# main.py
import base64
import hashlib
import os
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.security import APIKeyHeader

import config
import crud
import models
from database import SessionLocal, engine
from document_processor import process_document_content, process_document_from_url
from vector_service import upsert_document_chunks, get_relevant_clauses
from llm_service import get_answer_from_llm

#models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="Intelligent Query–Retrieval System",
    description="An LLM-powered system with efficient file uploads.",
    version="2.0.0"
)

# --- Middleware and Security (remains the same) ---
origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080" , "https://docuquery-client.onrender.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

@app.get("/debug-config")
def debug_config():
    """
    A temporary endpoint to check the live server's configuration.
    """
    # This will show us exactly what the server is configured with
    return {
        "message": "Debugging server configuration",
        "configured_origins": origins,
        "client_url_from_env": os.getenv("CLIENT_URL"),
        "bearer_token_is_set": os.getenv("BEARER_TOKEN") is not None
    }

async def verify_token(token: str = Security(api_key_header)):
    if not token or token.replace("Bearer ", "") != config.BEARER_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid or missing Authorization token")

# --- Pydantic Models ---
class HackRxRequest(BaseModel):
    questions: List[str]
    document_url: Optional[str] = None
    filename: Optional[str] = None
    file_content_base64: Optional[str] = None

class HackRxResponse(BaseModel):
    answers: List[str]

# --- Single Unified Endpoint ---
@app.post("/hackrx/run", response_model=HackRxResponse, summary="Process Document via JSON (URL or Base64 File)")
async def run_submission_json(
    request: HackRxRequest,
    _=Security(verify_token),
    db: Session = Depends(get_db)
):
    # --- 1. Validate Input ---
    is_url_provided = request.document_url is not None
    is_file_provided = request.file_content_base64 is not None and request.filename is not None

    if not is_url_provided and not is_file_provided:
        raise HTTPException(status_code=400, detail="Either 'document_url' or 'file_content_base64' with 'filename' must be provided.")
    if is_url_provided and is_file_provided:
        raise HTTPException(status_code=400, detail="Provide either 'document_url' or a file, not both.")
    if is_file_provided and not request.questions:
         raise HTTPException(status_code=400, detail="Questions are required.")

    # --- 2. Process Request ---
    answers = []
    if is_file_provided:
        # --- Handle Base64 File Upload ---
        try:
            content_bytes = base64.b64decode(request.file_content_base64)
            checksum = hashlib.sha256(content_bytes).hexdigest()
        except (base64.binascii.Error, TypeError):
            raise HTTPException(status_code=400, detail="Invalid Base64 string.")

        doc_identifier = request.filename
        db_document = crud.get_document_by_checksum(db, checksum=checksum)

        if not db_document:
            print(f"INFO: New Base64 file. Processing and indexing (Checksum: {checksum[:10]}...).")
            chunks = await process_document_content(content_bytes, doc_identifier)
            await upsert_document_chunks(doc_identifier, chunks, checksum=checksum)
            db_document = crud.create_document(db, url=doc_identifier, checksum=checksum)
        else:
            print(f"INFO: File found in cache. Skipping ingestion.")
        
        for question in request.questions:
            relevant_clauses = await get_relevant_clauses(doc_identifier, question, checksum=checksum)
            answer = await get_answer_from_llm(question, relevant_clauses)
            answers.append(answer)
            crud.create_query(db, document_id=db_document.id, question=question, answer=answer)

    else: # if is_url_provided:
        # --- Handle URL ---
        doc_identifier = request.document_url
        db_document = crud.get_document_by_url(db, url=doc_identifier)

        if not db_document:
            print(f"INFO: New URL. Processing and indexing: {doc_identifier}")
            chunks = await process_document_from_url(doc_identifier)
            await upsert_document_chunks(doc_identifier, chunks)
            db_document = crud.create_document(db, url=doc_identifier, checksum=None)
        else:
            print(f"INFO: URL found in cache. Skipping ingestion.")
        
        for question in request.questions:
            relevant_clauses = await get_relevant_clauses(doc_identifier, question)
            answer = await get_answer_from_llm(question, relevant_clauses)
            answers.append(answer)
            crud.create_query(db, document_id=db_document.id, question=question, answer=answer)

    return HackRxResponse(answers=answers)