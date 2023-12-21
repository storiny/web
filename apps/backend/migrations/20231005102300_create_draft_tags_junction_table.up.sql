CREATE TABLE IF NOT EXISTS draft_tags
(
	name     TEXT   NOT NULL
		CONSTRAINT name_length CHECK (NAME ~ '^[a-z0-9-]{1,32}$'),
	story_id BIGINT NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	PRIMARY KEY (name, story_id)
);
