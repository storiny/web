CREATE TABLE IF NOT EXISTS story_contributors
(
	user_id     BIGINT NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	story_id    BIGINT NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	role        TEXT   NOT NULL DEFAULT 'editor'
		CONSTRAINT role_value CHECK (role IN ('editor', 'viewer')),
	accepted_at TIMESTAMPTZ,
	deleted_at  TIMESTAMPTZ,
	PRIMARY KEY (user_id, story_id)
);
