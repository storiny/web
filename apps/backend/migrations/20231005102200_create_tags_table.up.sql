CREATE TABLE IF NOT EXISTS tags (
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake (),
    name TEXT NOT NULL CONSTRAINT name_length CHECK (char_length(NAME) <= 32 AND char_length(NAME) >= 1),
    -- Stats
    follower_count unsigned_int32 NOT NULL DEFAULT 0,
    story_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_name_on_tags ON tags (name);

CREATE INDEX follower_count_on_tags ON tags (follower_count);

