import hashlib
from typing import List, Optional
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai
import config

# Configure the Gemini client
genai.configure(api_key=config.GOOGLE_API_KEY)

# Initialize Pinecone client
pinecone_client = Pinecone(api_key=config.PINECONE_API_KEY)

def _get_document_namespace(source: str, checksum: Optional[str] = None) -> str:
    """
    Creates a unique namespace from checksum (if available for files)
    or by hashing the source URL.
    """
    if checksum:
        return checksum
    return hashlib.sha256(source.encode()).hexdigest()

async def get_embedding(text: str, task_type: str) -> List[float]:
    """
    Generates an embedding for a given text using Google's model.
    """
    response = await genai.embed_content_async(
        model=config.EMBEDDING_MODEL,
        content=text,
        task_type=task_type
    )
    return response['embedding']

async def upsert_document_chunks(source: str, chunks: List[str], checksum: Optional[str] = None):
    """Embeds document chunks in batches and upserts them into the Pinecone index."""
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(source, checksum)

    if index_name not in pinecone_client.list_indexes().names():
        pinecone_client.create_index(
            name=index_name,
            dimension=768,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    
    index = pinecone_client.Index(index_name)
    
    # Process chunks in batches (e.g., 100 per API call) for efficiency
    for i in range(0, len(chunks), 100):
        batch_chunks = chunks[i:i+100]
        
        response = await genai.embed_content_async(
            model=config.EMBEDDING_MODEL,
            content=batch_chunks,
            task_type="RETRIEVAL_DOCUMENT"
        )
        batch_embeddings = response['embedding']

        vectors_to_upsert = []
        for j, chunk in enumerate(batch_chunks):
            vector_id = f"{namespace}-{i+j}"
            vectors_to_upsert.append({
                "id": vector_id,
                "values": batch_embeddings[j],
                # FIX: Removed the oversized 'doc_source' to prevent Pinecone metadata limit errors
                "metadata": {"text": chunk}
            })

        if vectors_to_upsert:
            index.upsert(vectors=vectors_to_upsert, namespace=namespace)
    
    print(f"INFO: Successfully upserted {len(chunks)} chunks to Pinecone.")

async def get_relevant_clauses(source: str, question: str, checksum: Optional[str] = None) -> List[str]:
    """Finds and returns the most relevant text clauses for a given question."""
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(source, checksum)
    index = pinecone_client.Index(index_name)

    query_embedding = await get_embedding(question, task_type="RETRIEVAL_QUERY")

    query_result = index.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=config.TOP_K_CLAUSES,
        include_metadata=True
    )
    
    clauses = [match['metadata']['text'] for match in query_result['matches']]
    return clauses