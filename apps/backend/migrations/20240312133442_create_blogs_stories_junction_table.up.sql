CREATE TABLE IF NOT EXISTS blog_stories
(
	-- A story can only be added to a single blog at a time.
	story_id    BIGINT UNIQUE NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	blog_id     BIGINT        NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
	accepted_at TIMESTAMPTZ,
	deleted_at  TIMESTAMPTZ,
	PRIMARY KEY (story_id, blog_id)
);

CREATE INDEX accepted_at_on_blog_stories ON blog_stories (accepted_at);
