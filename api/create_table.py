import os
import models  # Import your SQLAlchemy models
from database import engine # Import your configured database engine
from dotenv import load_dotenv

# Load the .env file to get the DATABASE_URL
load_dotenv()

def main():
    """
    Connects to the cloud database and creates all tables.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url or 'localhost' in db_url:
        print("❌ Error: DATABASE_URL is not set or points to localhost.")
        print("Please ensure your .env file has the correct Neon connection string.")
        return

    print("Connecting to the database...")
    print(f"Target: {engine.url.host}")

    try:
        print("Creating all tables based on models.py...")
        models.Base.metadata.create_all(bind=engine)
        print("✅ Success! All tables were created.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()