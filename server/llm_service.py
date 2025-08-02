# llm_service.py
from typing import List
from openai import AsyncOpenAI
import config

# Initialize client
client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

async def get_answer_from_llm(question: str, context_clauses: List[str]) -> str:
    """
    Generates an answer to a question using an LLM, based on provided context clauses.
    """
    if not context_clauses:
        return "I could not find relevant information in the document to answer this question."

    context = "\n\n".join(context_clauses)
    
    system_prompt = (
        "You are an intelligent assistant specializing in document analysis for insurance, legal, and HR domains. "
        "Your task is to answer the user's question based *only* on the provided context clauses from the document. "
        "Provide a clear, direct, and concise answer. If the context does not contain the information needed to "
        "answer the question, explicitly state that the information is not available in the provided context."
    )

    try:
        response = await client.chat.completions.create(
            model=config.GENERATION_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context Clauses:\n{context}\n\nQuestion:\n{question}"}
            ],
            temperature=0.0,  # Set to 0 for deterministic, fact-based answers
        )
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        # In a real app, log this error
        print(f"Error calling OpenAI API: {e}")
        return "There was an error while generating the answer. Please try again."
    