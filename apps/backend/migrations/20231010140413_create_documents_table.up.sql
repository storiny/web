CREATE TABLE IF NOT EXISTS documents
(
	id       BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
	key      UUID          NOT NULL UNIQUE, -- S3 key
	story_id BIGINT UNIQUE REFERENCES stories (id) ON DELETE SET NULL
);
