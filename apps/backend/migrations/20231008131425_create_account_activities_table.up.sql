CREATE TABLE IF NOT EXISTS account_activities
(
	id          BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	type        SMALLINT    NOT NULL,
	-- Description can be NULL, as it can be constructed in the application layer for common activity types
	description TEXT
		CONSTRAINT description_length CHECK (CHAR_LENGTH(description) <= 512),
	user_id     BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_id_on_account_activities ON account_activities (user_id);

CREATE INDEX created_at_on_account_activities ON account_activities (created_at);

