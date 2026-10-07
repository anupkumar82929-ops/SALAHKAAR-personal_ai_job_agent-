CREATE TABLE ai_conversations (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    title VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_conversation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_conversations_user_id
ON ai_conversations(user_id);


CREATE TABLE ai_messages (
    id BIGSERIAL PRIMARY KEY,

    conversation_id BIGINT NOT NULL,

    role VARCHAR(20) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES ai_conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_ai_message_role
        CHECK (
            role IN (
                'user',
                'assistant',
                'system'
            )
        )
);

CREATE INDEX idx_ai_messages_conversation_id
ON ai_messages(conversation_id);

CREATE INDEX idx_ai_messages_created_at
ON ai_messages(created_at);