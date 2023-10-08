CREATE TABLE IF NOT EXISTS tags(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    name TEXT NOT NULL CONSTRAINT name_length CHECK (NAME ~ '^[a-z0-9-]{1,32}$'),
    -- Stats
    follower_count unsigned_int32 NOT NULL DEFAULT 0,
    story_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_name_on_tags ON tags(name);

CREATE INDEX follower_count_on_tags ON tags(follower_count);

