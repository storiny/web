CREATE TABLE IF NOT EXISTS newsletter_tokens
(
	-- Hashed token value
	id         TEXT PRIMARY KEY,
	blog_id    BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	email      citext      NOT NULL
		CONSTRAINT email_length CHECK (CHAR_LENGTH(email) <= 300 AND CHAR_LENGTH(email) >= 3),
	expires_at TIMESTAMPTZ NOT NULL,
	UNIQUE (blog_id, email)
);
