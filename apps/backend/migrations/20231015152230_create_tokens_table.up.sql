CREATE TABLE IF NOT EXISTS tokens(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    type text NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

