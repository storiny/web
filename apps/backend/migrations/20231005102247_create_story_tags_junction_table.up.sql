CREATE TABLE IF NOT EXISTS story_tags
(
	id       BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
	story_id BIGINT NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	tag_id   BIGINT NOT NULL
		REFERENCES tags (id)
			ON DELETE CASCADE,
	UNIQUE (story_id, tag_id)
);
