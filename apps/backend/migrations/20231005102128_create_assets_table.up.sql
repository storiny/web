CREATE TABLE IF NOT EXISTS assets
(
	id            BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	key           UUID        NOT NULL UNIQUE,    -- S3 asset key
	hex           hex_color   NOT NULL,
	alt           TEXT        NOT NULL DEFAULT ''
		CONSTRAINT alt_length CHECK (CHAR_LENGTH(alt) <= 128),
	height        SMALLINT    NOT NULL,
	width         SMALLINT    NOT NULL,
	rating        SMALLINT    NOT NULL DEFAULT 1, -- Not rated by default
	-- Timestamps
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	favourited_at TIMESTAMPTZ,
	UNIQUE (key, hex)
);

CREATE INDEX created_at_on_assets ON assets (created_at);
