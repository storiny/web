CREATE TABLE IF NOT EXISTS documents
(
	id       BIGINT PRIMARY KEY            DEFAULT public.next_snowflake(),
	key      UUID          NOT NULL UNIQUE DEFAULT uuid_generate_v4(), -- S3 key
	story_id BIGINT UNIQUE REFERENCES stories (id) ON DELETE SET NULL
);
