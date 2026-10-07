from openai import OpenAI

from app.core.config import settings


def generate_ai_response(
    messages: list[dict[str, str]],
) -> str:
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured."
        )

    client = OpenAI(
        api_key=settings.openai_api_key
    )

    response = client.responses.create(
        model=settings.openai_model,
        input=messages,
    )

    return response.output_text.strip()