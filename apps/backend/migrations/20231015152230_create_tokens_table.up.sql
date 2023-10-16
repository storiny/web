CREATE TABLE IF NOT EXISTS tokens(
    -- ID is always 24 characters long
    id char(24) PRIMARY KEY,
    type text NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);
