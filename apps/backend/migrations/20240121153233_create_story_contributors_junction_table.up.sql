CREATE TABLE IF NOT EXISTS story_contributors
(
	id          BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	user_id     BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	story_id    BIGINT      NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	role        TEXT        NOT NULL DEFAULT 'editor'
		CONSTRAINT role_value CHECK (role IN ('editor', 'viewer')),
	-- Timestamps
	created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at TIMESTAMPTZ,
	deleted_at  TIMESTAMPTZ,
	UNIQUE (user_id, story_id)
);

CREATE INDEX accepted_at_on_story_contributors ON story_contributors (accepted_at);
