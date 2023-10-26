CREATE TABLE IF NOT EXISTS tags
(
	id             BIGINT PRIMARY KEY      DEFAULT public.next_snowflake(),
	name           TEXT           NOT NULL UNIQUE
		CONSTRAINT name_length CHECK (NAME ~ '^[a-z0-9-]{1,32}$'),
	-- Stats
	follower_count unsigned_int32 NOT NULL DEFAULT 0,
	story_count    unsigned_int32 NOT NULL DEFAULT 0,
	-- Timestamps
	created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
	-- FTS
	search_vec     TSVECTOR GENERATED ALWAYS AS (TO_TSVECTOR('english', "name")) STORED
);

CREATE INDEX follower_count_on_tags ON tags (follower_count);

CREATE INDEX search_vec_on_tags ON tags USING GIN (search_vec);

