"""LLM provider — OpenAI-compatible abstraction with retry and mock fallback."""

from app.services.classifier import Intent


async def classify_with_llm(message: str) -> Intent:
    """Classify intent using LLM. Placeholder for Step 14."""
    # Will be fully implemented when OPENAI_API_KEY is configured
    from app.services.classifier import classify_stub
    return classify_stub(message)


async def generate_response_stream(message: str, context: dict):
    """Generate a streaming response using LLM. Placeholder for Step 14."""
    # Yields tokens as they are generated
    yield message  # echo back for now
