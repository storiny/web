CREATE TABLE IF NOT EXISTS comments(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    content TEXT NOT NULL CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2048),
    -- Rendered content can expand as it gets converted from markdown to HTML string
    rendered_content rendered_markdown_text CONSTRAINT rendered_bio CHECK (char_length(rendered_content) <= 3200),
    hidden BOOL NOT NULL DEFAULT FALSE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
    -- Stats
    like_count unsigned_int32 NOT NULL DEFAULT 0,
    reply_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

