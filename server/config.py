# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# --- Security ---
BEARER_TOKEN = "af215d20c2561423c20b7ccdfbb4dbc6fe7c5bb9bc869dae38917c8de16368ca"

# --- Google Gemini Configuration ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# Gemini model for generating text embeddings
EMBEDDING_MODEL = "models/embedding-001"
# Gemini model for generating conversational answers
GENERATION_MODEL = "gemini-1.5-flash-latest"

# --- Pinecone Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = "hackrx-gemini-index"

# --- System Configuration ---
TOP_K_CLAUSES =12