import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file BEFORE doing anything else
load_dotenv()

# Get the database URL from the environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Add a check to ensure the variable is loaded
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ DATABASE_URL environment variable not found. Please check your .env file.")

# This part remains the same
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()