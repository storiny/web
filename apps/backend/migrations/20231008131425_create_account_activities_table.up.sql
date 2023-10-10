CREATE TABLE IF NOT EXISTS account_activities(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    type SMALLINT NOT NULL,
    -- Description can be NULL, as it can be constructed in the application layer for common activity types
    description TEXT CONSTRAINT description_length CHECK (char_length(description) <= 512),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

