CREATE TABLE IF NOT EXISTS replies(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    content TEXT NOT NULL CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1024),
    -- Rendered content can expand as it gets converted from markdown to HTML string
    rendered_content rendered_markdown_text CONSTRAINT rendered_bio CHECK (char_length(rendered_content) <= 2048),
    hidden BOOL NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    -- Stats
    like_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX user_id_on_replies on replies(user_id);

create index comment_id_on_replies on replies(comment_id);

create index like_count_on_replies on replies(like_count);

create index created_at_on_replies on replies(created_at);

create index deleted_at_on_replies on replies(deleted_at);