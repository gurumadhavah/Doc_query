# main.py
from fastapi import FastAPI, HTTPException, Security, status, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, HttpUrl
from typing import List
from sqlalchemy.orm import Session

# --- Project Imports ---
import config
import crud
import models
from database import SessionLocal, engine
from document_processor import process_document_from_url
from vector_service import upsert_document_chunks, get_relevant_clauses
from llm_service import get_answer_from_llm

# --- Database Setup ---
# This line creates the database tables if they don't exist.
# For production, it's better to manage this with Alembic migrations.
models.Base.metadata.create_all(bind=engine)

# Dependency to get a DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Intelligent Query–Retrieval System",
    description="An LLM-powered system to query large documents with database caching.",
    version="1.1.0"
)

# --- Security Setup ---
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

async def verify_token(token: str = Security(api_key_header)):
    """Dependency to verify the bearer token."""
    if not token or token.replace("Bearer ", "") != config.BEARER_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid or missing Authorization token"
        )

# --- Pydantic Models for API ---
class HackRxRequest(BaseModel):
    documents: HttpUrl
    questions: List[str]

class HackRxResponse(BaseModel):
    answers: List[str]

# --- API Endpoint ---
@app.post("/hackrx/run", 
          response_model=HackRxResponse,
          summary="Run Document Query Submission",
          tags=["Query System"])
async def run_submission(
    request: HackRxRequest, 
    _=Security(verify_token), 
    db: Session = Depends(get_db)
):
    """
    This endpoint processes a document from a URL, answers questions,
    and uses a PostgreSQL database to cache processed documents.
    """
    doc_url = str(request.documents)
    
    try:
        # 1. Check DB to see if the document has been processed before
        db_document = crud.get_document_by_url(db, url=doc_url)
        
        if not db_document:
            print(f"INFO: New document. Processing and indexing: {doc_url}")
            # 2. If not, process, index, and save to DB
            chunks = await process_document_from_url(doc_url)
            await upsert_document_chunks(doc_url, chunks)
            db_document = crud.create_document(db, url=doc_url)
        else:
            print(f"INFO: Document found in cache. Skipping ingestion.")
        
        answers = []
        for question in request.questions:
            # 3. Retrieve relevant clauses from vector DB
            relevant_clauses = await get_relevant_clauses(doc_url, question)
            
            # 4. Generate answer using LLM
            answer = await get_answer_from_llm(question, relevant_clauses)
            answers.append(answer)

            # 5. Log the question and its answer to the database
            crud.create_query(
                db, 
                document_id=db_document.id, 
                question=question, 
                answer=answer
            )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal server error occurred.")

    return HackRxResponse(answers=answers)