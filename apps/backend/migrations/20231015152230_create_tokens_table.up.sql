CREATE TABLE IF NOT EXISTS tokens
(
	-- Hashed token value
	id         TEXT PRIMARY KEY,
	type       SMALLINT    NOT NULL,
	user_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX user_id_on_tokens ON tokens (user_id);

