# models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    # URL is no longer unique, as we might have multiple data URLs for the same file (though we'll avoid storing them)
    url = Column(String, index=True, nullable=True) 
    # Checksum is the new unique key for file content
    checksum = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    queries = relationship("Query", back_populates="document")

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    document_id = Column(Integer, ForeignKey("documents.id"))
    
    document = relationship("Document", back_populates="queries")