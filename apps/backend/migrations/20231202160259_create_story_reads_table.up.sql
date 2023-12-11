CREATE TABLE IF NOT EXISTS story_reads
(
	id           BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	-- `hostname` is NULL for internal referrers
	hostname     TEXT
		CONSTRAINT hostname_length CHECK (CHAR_LENGTH(hostname) <= 512),
	-- `Unknown` by default
	device       SMALLINT    NOT NULL DEFAULT 0,
	-- We can store both the ISO 3166-1 alpha-2 and ISO 3166-1 alpha-3 formats
	country_code TEXT
		CONSTRAINT country_code_length CHECK (CHAR_LENGTH(country_code) BETWEEN 2 AND 3),
	-- The read session duration (in seconds)
	duration     SMALLINT    NOT NULL DEFAULT 0,
	user_id      BIGINT      REFERENCES users (id) ON DELETE SET NULL,
	story_id     BIGINT      NOT NULL
		REFERENCES stories (id)
			ON DELETE CASCADE,
	created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
