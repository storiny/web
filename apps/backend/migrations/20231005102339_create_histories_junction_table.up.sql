CREATE TABLE IF NOT EXISTS histories
(
	user_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	story_id   BIGINT      NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (user_id, story_id)
);

CREATE INDEX created_at_on_histories ON histories (created_at);

