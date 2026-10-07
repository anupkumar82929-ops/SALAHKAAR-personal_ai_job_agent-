from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from app.api.auth import get_current_user
from app.ai.conversation_repository import (
    add_message,
    create_conversation,
    get_conversation_messages,
    get_user_conversations,
)


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


class ConversationCreate(BaseModel):
    title: str | None = Field(
        default=None,
        max_length=255,
    )


class MessageCreate(BaseModel):
    role: str = Field(
        min_length=1,
        max_length=20,
    )

    content: str = Field(
        min_length=1,
    )


@router.post("/conversations")
def create_ai_conversation(
    request: ConversationCreate,
    current_user: dict = Depends(get_current_user),
):
    return create_conversation(
        user_id=current_user["id"],
        title=request.title,
    )


@router.get("/conversations")
def list_ai_conversations(
    current_user: dict = Depends(get_current_user),
):
    conversations = get_user_conversations(
        user_id=current_user["id"],
    )

    return {
        "count": len(conversations),
        "conversations": conversations,
    }


@router.post("/conversations/{conversation_id}/messages")
def create_ai_message(
    conversation_id: int = Path(..., ge=1),
    request: MessageCreate = ...,
    current_user: dict = Depends(get_current_user),
):
    try:
        # Verify that the conversation belongs to
        # the authenticated user before adding a message.
        existing_messages = get_conversation_messages(
            user_id=current_user["id"],
            conversation_id=conversation_id,
        )

        # The result is intentionally not used here.
        # The repository call above performs ownership validation.
        _ = existing_messages

        return add_message(
            conversation_id=conversation_id,
            role=request.role,
            content=request.content,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("/conversations/{conversation_id}/messages")
def list_ai_messages(
    conversation_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    try:
        messages = get_conversation_messages(
            user_id=current_user["id"],
            conversation_id=conversation_id,
        )

        return {
            "count": len(messages),
            "messages": messages,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )