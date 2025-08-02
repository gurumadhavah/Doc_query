# document_processor.py
import requests
import io
import fitz  # PyMuPDF
import docx
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter

def _extract_text_from_pdf(content: bytes) -> str:
    """Extracts text from PDF file content."""
    with fitz.open(stream=content, filetype="pdf") as doc:
        text = "".join(page.get_text() for page in doc)
    return text

def _extract_text_from_docx(content: bytes) -> str:
    """Extracts text from DOCX file content."""
    doc = docx.Document(io.BytesIO(content))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text

def get_text_chunks(text: str) -> List[str]:
    """Splits a long text into smaller, semantically coherent chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

async def process_document_from_url(url: str) -> List[str]:
    """
    Downloads a document from a URL, extracts its text, and splits it into chunks.
    
    Args:
        url: The URL of the PDF or DOCX document.

    Returns:
        A list of text chunks from the document.
        
    Raises:
        ValueError: If the document format is unsupported or the download fails.
    """
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        
        content = response.content
        
        if ".pdf" in url.lower():
            raw_text = _extract_text_from_pdf(content)
        elif ".docx" in url.lower():
            raw_text = _extract_text_from_docx(content)
        else:
            raise ValueError("Unsupported document format. Only PDF and DOCX are supported.")
            
        chunks = get_text_chunks(raw_text)
        return chunks

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to download document from URL: {url}. Error: {e}")
    except Exception as e:
        raise RuntimeError(f"Failed to process document. Error: {e}")