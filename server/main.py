# main.py
from fastapi import FastAPI, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, HttpUrl
from typing import List

import config
from document_processor import process_document_from_url
from vector_service import upsert_document_chunks, get_relevant_clauses
from llm_service import get_answer_from_llm

# --- App Initialization ---
app = FastAPI(
    title="Intelligent Query–Retrieval System",
    description="An LLM-powered system to query large documents.",
    version="1.0.0"
)

# --- Security ---
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
async def run_submission(request: HackRxRequest, _=Security(verify_token)):
    """
    This endpoint processes a document from a URL, indexes its content,
    and answers a list of questions based on the document's context.
    
    Workflow:
    1.  **Download & Chunk**: Fetches the document and splits it into text chunks.
    2.  **Embed & Index**: Converts chunks into vectors and stores them in Pinecone.
    3.  **Query & Retrieve**: For each question, finds the most relevant chunks.
    4.  **Generate & Answer**: Uses an LLM to synthesize an answer from the chunks.
    """
    doc_url = str(request.documents)
    
    try:
        # 1. & 2. Process and index the document. This is done once per document URL.
        # In a production system, you'd add caching here to avoid reprocessing.
        chunks = await process_document_from_url(doc_url)
        await upsert_document_chunks(doc_url, chunks)
        
        # 3. & 4. Process each question concurrently or sequentially
        answers = []
        for question in request.questions:
            relevant_clauses = await get_relevant_clauses(doc_url, question)
            answer = await get_answer_from_llm(question, relevant_clauses)
            answers.append(answer)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Log the full error for debugging
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal server error occurred.")

    return HackRxResponse(answers=answers)

# To run the server locally:
# uvicorn main:app --reload