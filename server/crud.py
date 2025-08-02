# crud.py
from sqlalchemy.orm import Session
from . import models

def get_document_by_url(db: Session, url: str):
    """Retrieve a document from the database by its URL."""
    return db.query(models.Document).filter(models.Document.url == url).first()

def create_document(db: Session, url: str):
    """Add a new document to the database."""
    db_document = models.Document(url=url)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def create_query(db: Session, document_id: int, question: str, answer: str):
    """Log a question and its answer to the database."""
    db_query = models.Query(
        question=question, 
        answer=answer, 
        document_id=document_id
    )
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    return db_query