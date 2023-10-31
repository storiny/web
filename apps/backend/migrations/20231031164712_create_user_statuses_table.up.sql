CREATE TABLE IF NOT EXISTS user_statuses
(
	user_id    BIGINT PRIMARY KEY
		REFERENCES users (id)
			ON DELETE CASCADE,
	text       TEXT
		CONSTRAINT text_length CHECK (CHAR_LENGTH(text) <= 128),
	emoji      TEXT
		CONSTRAINT emoji_length CHECK (CHAR_LENGTH(emoji) <= 64),
	duration   SMALLINT    NOT NULL DEFAULT 5, -- 1 day by default
	visibility SMALLINT    NOT NULL DEFAULT 1, -- Global by default
	-- Timestamps
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMPTZ
);
