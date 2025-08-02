# config.py
import os
from dotenv import load_dotenv

# Load environment variables from a .env file for local development
load_dotenv()

# --- Security ---
# The bearer token for API authentication as provided in the problem statement
BEARER_TOKEN = "af215d20c2561423c20b7ccdfbb4dbc6fe7c5bb9bc869dae38917c8de16368ca"

# --- OpenAI Configuration ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# Using a cost-effective and capable embedding model
EMBEDDING_MODEL = "text-embedding-3-small"
# Using a powerful and fast generation model
GENERATION_MODEL = "gpt-4-turbo"

# --- Pinecone Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
# The name of the index where vectors will be stored
PINECONE_INDEX_NAME = "hackrx-index"

# --- System Configuration ---
# Number of relevant clauses to retrieve for context
TOP_K_CLAUSES = 5