CREATE TABLE IF NOT EXISTS account_activities(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    type SMALLINT NOT NULL,
    description TEXT NOT NULL CONSTRAINT description_length CHECK (char_length(description) <= 512),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

