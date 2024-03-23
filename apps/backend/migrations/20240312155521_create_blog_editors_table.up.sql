CREATE TABLE IF NOT EXISTS blog_editors
(
	id          BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	user_id     BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	blog_id     BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at TIMESTAMPTZ,
	deleted_at  TIMESTAMPTZ,
	UNIQUE (user_id, blog_id)
);

CREATE INDEX accepted_at_on_blog_editors ON blog_editors (accepted_at);
