CREATE TABLE IF NOT EXISTS connections
(
	id                  BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	provider            SMALLINT    NOT NULL,
	provider_identifier TEXT        NOT NULL
		CONSTRAINT provider_identifier_length CHECK (CHAR_LENGTH(provider_identifier) <= 512),
	display_name        TEXT        NOT NULL
		CONSTRAINT display_name_length CHECK (CHAR_LENGTH(display_name) <= 256),
	hidden              BOOL        NOT NULL DEFAULT FALSE,
	user_id             BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (user_id, provider)
);

