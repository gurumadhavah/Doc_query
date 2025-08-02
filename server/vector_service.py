# vector_service.py
import hashlib
from typing import List
from pinecone import Pinecone, ServerlessSpec
from openai import AsyncOpenAI
import config

# Initialize clients
pinecone_client = Pinecone(api_key=config.PINECONE_API_KEY)
openai_client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

def _get_document_namespace(url: str) -> str:
    """Creates a unique and deterministic namespace for a document URL."""
    return hashlib.sha256(url.encode()).hexdigest()

async def get_embedding(text: str) -> List[float]:
    """Generates an embedding for a given text using OpenAI's model."""
    response = await openai_client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding

async def upsert_document_chunks(url: str, chunks: List[str]):
    """
    Embeds document chunks and upserts them into the Pinecone index.
    A namespace is used to isolate vectors by document.
    """
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(url)

    # Create the index if it doesn't exist
    if index_name not in pinecone_client.list_indexes().names():
        pinecone_client.create_index(
            name=index_name,
            dimension=1536,  # Dimension for text-embedding-3-small
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    
    index = pinecone_client.Index(index_name)
    
    # Prepare vectors for upsert
    vectors_to_upsert = []
    for i, chunk in enumerate(chunks):
        embedding = await get_embedding(chunk)
        vector_id = f"{namespace}-{i}"
        vectors_to_upsert.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {"text": chunk, "doc_url": url}
        })
    
    # Upsert in batches for efficiency
    for i in range(0, len(vectors_to_upsert), 100):
        batch = vectors_to_upsert[i:i+100]
        index.upsert(vectors=batch, namespace=namespace)

async def get_relevant_clauses(url: str, question: str) -> List[str]:
    """
    Finds and returns the most relevant text clauses for a given question
    by performing a semantic search in the Pinecone index.
    """
    index_name = config.PINECONE_INDEX_NAME
    namespace = _get_document_namespace(url)
    index = pinecone_client.Index(index_name)

    # Embed the user's question
    query_embedding = await get_embedding(question)

    # Query the index within the document's namespace
    query_result = index.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=config.TOP_K_CLAUSES,
        include_metadata=True
    )
    
    # Extract the text from the metadata of the results
    clauses = [match['metadata']['text'] for match in query_result['matches']]
    return clauses