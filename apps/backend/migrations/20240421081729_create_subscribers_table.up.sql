CREATE TABLE IF NOT EXISTS subscribers
(
	id         BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	blog_id    BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	email      citext      NOT NULL
		CONSTRAINT email_length CHECK (CHAR_LENGTH(email) <= 300 AND CHAR_LENGTH(email) >= 3),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (blog_id, email)
);

CREATE INDEX blog_id_on_subscribers ON subscribers (blog_id);