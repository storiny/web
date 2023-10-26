CREATE TABLE IF NOT EXISTS documents
(
	key      TEXT PRIMARY KEY NOT NULL, -- Hashed S3 key
	story_id BIGINT UNIQUE    REFERENCES stories (id) ON DELETE SET NULL
);

