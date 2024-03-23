CREATE TABLE IF NOT EXISTS blog_followers
(
	user_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	blog_id    BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (user_id, blog_id)
);

CREATE INDEX created_at_on_blog_followers ON blog_followers (created_at);
