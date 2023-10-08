CREATE TABLE IF NOT EXISTS assets(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    key TEXT NOT NULL UNIQUE, -- S3 asset key
    hex hex_color NOT NULL,
    alt TEXT CONSTRAINT alt_length CHECK (char_length(alt) <= 128),
    height SMALLINT NOT NULL,
    width SMALLINT NOT NULL,
    rating SMALLINT NOT NULL DEFAULT 1, -- Not rated by default
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- Cascade action will result in orphaned objects in S3
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    favourited_at TIMESTAMPTZ
);

