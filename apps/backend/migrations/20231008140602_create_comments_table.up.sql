CREATE TABLE IF NOT EXISTS comments(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    content TEXT NOT NULL CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2048),
    -- Rendered content can expand as it gets converted from markdown to HTML string
    rendered_content rendered_markdown_text CONSTRAINT rendered_bio CHECK (char_length(rendered_content) <= 3200),
    hidden BOOL NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    -- Stats
    like_count unsigned_int32 NOT NULL DEFAULT 0,
    reply_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX user_id_on_comments on comments(user_id);

CREATE index story_id_on_comments on comments(story_id);

CREATE INDEX reply_count_on_comments on comments(reply_count);

CREATE INDEX like_count_on_comments on comments(like_count);

CREATE INDEX created_at_on_comments on comments(created_at);

CREATE INDEX deleted_at_on_comments on comments(deleted_at);