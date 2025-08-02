# vector_service.py
import hashlib
from typing import List
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai
import config

# Configure the Gemini client
genai.configure(api_key=config.GOOGLE_API_KEY)

# Initialize Pinecone client
pinecone_client = Pinecone(api_key=config.PINECONE_API_KEY)

def _get_document_namespace(url: str) -> str:
    """Creates a unique and deterministic namespace for a document URL."""
    return hashlib.sha256(url.encode()).hexdigest()

async def get_embedding(text: str, task_type: str) -> List[float]:
    """
    Generates an embedding for a given text using Google's model.
    task_type can be "RETRIEVAL_QUERY" or "RETRIEVAL_DOCUMENT".
    """
    response = await genai.embed_content_async(
        model=config.EMBEDDING_MODEL,
        content=text,
        task_type=task_type
    )
    return response['embedding']

async def upsert_document_chunks(url: str, chunks: List[str]):
    """Embeds document chunks and upserts them into the Pinecone index."""
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(url)

    if index_name not in pinecone_client.list_indexes().names():
        # Gemini embedding dimension is 768
        pinecone_client.create_index(
            name=index_name,
            dimension=768,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    
    index = pinecone_client.Index(index_name)
    
    vectors_to_upsert = []
    for i, chunk in enumerate(chunks):
        # Use "RETRIEVAL_DOCUMENT" for chunks meant for storage
        embedding = await get_embedding(chunk, task_type="RETRIEVAL_DOCUMENT")
        vector_id = f"{namespace}-{i}"
        vectors_to_upsert.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {"text": chunk, "doc_url": url}
        })

    for i in range(0, len(vectors_to_upsert), 100):
        batch = vectors_to_upsert[i:i+100]
        index.upsert(vectors=batch, namespace=namespace)

async def get_relevant_clauses(url: str, question: str) -> List[str]:
    """Finds and returns the most relevant text clauses for a given question."""
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(url)
    index = pinecone_client.Index(index_name)

    # Use "RETRIEVAL_QUERY" for the user's question
    query_embedding = await get_embedding(question, task_type="RETRIEVAL_QUERY")

    query_result = index.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=config.TOP_K_CLAUSES,
        include_metadata=True
    )
    
    clauses = [match['metadata']['text'] for match in query_result['matches']]
    return clauses