from app.database.connection import get_connection


def create_conversation(
    user_id: int,
    title: str | None = None,
) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ai_conversations (
                    user_id,
                    title
                )
                VALUES (%s, %s)
                RETURNING
                    id,
                    user_id,
                    title,
                    created_at,
                    updated_at;
                """,
                (user_id, title),
            )

            conversation = cursor.fetchone()

    return {
        "id": conversation[0],
        "user_id": conversation[1],
        "title": conversation[2],
        "created_at": conversation[3],
        "updated_at": conversation[4],
    }


def add_message(
    conversation_id: int,
    role: str,
    content: str,
) -> dict:
    role = role.strip().lower()

    if role not in {"user", "assistant", "system"}:
        raise ValueError(f"Invalid message role: {role}")

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ai_messages (
                    conversation_id,
                    role,
                    content
                )
                VALUES (%s, %s, %s)
                RETURNING
                    id,
                    conversation_id,
                    role,
                    content,
                    created_at;
                """,
                (
                    conversation_id,
                    role,
                    content,
                ),
            )

            message = cursor.fetchone()

            cursor.execute(
                """
                UPDATE ai_conversations
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = %s;
                """,
                (conversation_id,),
            )

    return {
        "id": message[0],
        "conversation_id": message[1],
        "role": message[2],
        "content": message[3],
        "created_at": message[4],
    }


def get_user_conversations(
    user_id: int,
) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    title,
                    created_at,
                    updated_at
                FROM ai_conversations
                WHERE user_id = %s
                ORDER BY updated_at DESC;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "title": row[1],
            "created_at": row[2],
            "updated_at": row[3],
        }
        for row in rows
    ]


def get_conversation_messages(
    user_id: int,
    conversation_id: int,
) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:

            # First make sure this conversation belongs
            # to the authenticated user.
            cursor.execute(
                """
                SELECT id
                FROM ai_conversations
                WHERE id = %s
                AND user_id = %s;
                """,
                (
                    conversation_id,
                    user_id,
                ),
            )

            conversation = cursor.fetchone()

            if conversation is None:
                raise ValueError("Conversation not found.")

            cursor.execute(
                """
                SELECT
                    id,
                    conversation_id,
                    role,
                    content,
                    created_at
                FROM ai_messages
                WHERE conversation_id = %s
                ORDER BY created_at ASC, id ASC;
                """,
                (conversation_id,),
            )

            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "conversation_id": row[1],
            "role": row[2],
            "content": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]