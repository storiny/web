CREATE TABLE IF NOT EXISTS blog_writers
(
	user_id     BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	blog_id     BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at TIMESTAMPTZ,
	deleted_at  TIMESTAMPTZ,
	PRIMARY KEY (user_id, blog_id)
);

CREATE INDEX accepted_at_on_blog_writers ON blog_writers (accepted_at);
