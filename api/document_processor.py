import requests
import io
import fitz  # PyMuPDF
import docx
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
import email
from extract_msg import Message

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

def _extract_text_from_email(content: bytes) -> str:
    """Extracts text from email file content (.eml)."""
    msg = email.message_from_bytes(content)
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                body = part.get_payload(decode=True).decode(errors='ignore')
                break
    else:
        body = msg.get_payload(decode=True).decode(errors='ignore')
    
    return f"Subject: {msg['subject']}\nFrom: {msg['from']}\nTo: {msg['to']}\n\n{body}"

def _extract_text_from_msg(content: bytes) -> str:
    """Extracts text from Outlook .msg files."""
    msg = Message(io.BytesIO(content))
    return f"From: {msg.sender}\nTo: {msg.to}\nSubject: {msg.subject}\nDate: {msg.date}\n\n{msg.body}"

def get_text_chunks(text: str) -> List[str]:
    """Splits a long text into smaller, semantically coherent chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=150,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

async def process_document_content(content: bytes, filename: str) -> List[str]:
    """
    Core function to extract text from raw file content based on filename
    and split it into chunks.
    """
    raw_text = ""
    filename_lower = filename.lower()

    # FIX: Changed from .endswith() to 'in' to handle URLs with query parameters
    if '.pdf' in filename_lower:
        raw_text = _extract_text_from_pdf(content)
    elif '.docx' in filename_lower or '.doc' in filename_lower:
        raw_text = _extract_text_from_docx(content)
    elif '.eml' in filename_lower:
        raw_text = _extract_text_from_email(content)
    elif '.msg' in filename_lower:
        raw_text = _extract_text_from_msg(content)
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    if not raw_text:
         raise ValueError("Could not extract text from the document.")

    return get_text_chunks(raw_text)

async def process_document_from_url(url: str) -> List[str]:
    """
    Wrapper function to download a document from a web URL, then process its content.
    """
    print(f"INFO: Downloading document from web URL: {url}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        content = response.content
        return await process_document_content(content, url)
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to download document from URL: {url}. Error: {e}")