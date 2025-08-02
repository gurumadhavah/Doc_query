# llm_service.py
from typing import List
import google.generativeai as genai
import config

# Configure the Gemini client
genai.configure(api_key=config.GOOGLE_API_KEY)

async def get_answer_from_llm(question: str, context_clauses: List[str]) -> str:
    """
    Generates an answer to a question using the Gemini model, based on provided context.
    """
    if not context_clauses:
        return "I could not find relevant information in the document to answer this question."

    context = "\n\n".join(context_clauses)
    
    # Gemini models work well with a single, detailed prompt.
    prompt = (
        "You are an intelligent assistant specializing in document analysis for insurance, legal, and HR domains. "
        "Your task is to answer the user's question based *only* on the provided context clauses from the document. "
        "Provide a clear, direct, and concise answer. If the context does not contain the information needed to "
        "answer the question, explicitly state that the information is not available in the provided context.\n\n"
        f"--- CONTEXT CLAUSES ---\n{context}\n\n"
        f"--- USER QUESTION ---\n{question}\n\n"
        "--- ANSWER ---\n"
    )

    try:
        model = genai.GenerativeModel(config.GENERATION_MODEL)
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.0)
        )
        return response.text.strip()
    
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "There was an error while generating the answer. Please try again."