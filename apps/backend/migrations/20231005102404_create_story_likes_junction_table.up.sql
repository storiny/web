CREATE TABLE IF NOT EXISTS story_likes
(
	user_id    BIGINT NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	story_id   BIGINT NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (user_id, story_id)
);

