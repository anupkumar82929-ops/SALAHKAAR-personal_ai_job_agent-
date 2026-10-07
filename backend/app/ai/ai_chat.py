from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from app.ai.assistant_service import generate_assistant_response
from app.api.auth import get_current_user


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=10000,
    )

    job_id: int | None = Field(
        default=None,
        ge=1,
    )


@router.post("/conversations/{conversation_id}/chat")
def chat(
    conversation_id: int = Path(..., ge=1),
    request: ChatRequest = ...,
    current_user: dict = Depends(get_current_user),
):
    try:
        return generate_assistant_response(
            user_id=current_user["id"],
            conversation_id=conversation_id,
            user_message=request.message,
            job_id=request.job_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )