CREATE TABLE IF NOT EXISTS documents
(
	id          BIGINT PRIMARY KEY          DEFAULT public.next_snowflake(),
	-- S3 key
	key         UUID        NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
	-- Editable boolean flag. When a published story is edited for the first time,
	-- an editable version of the original document is created which holds the
	-- modified (and yet to be published) version of the story. When the changes
	-- are published, the old non-editable document is deleted (by changing its
	-- `story_id` value to `NULL`) and this editable document is converted into a
	-- non-editable document.
	is_editable BOOL        NOT NULL        DEFAULT FALSE,
	story_id    BIGINT      REFERENCES stories (id) ON DELETE SET NULL,
	created_at  TIMESTAMPTZ NOT NULL        DEFAULT NOW(),
	UNIQUE (story_id, is_editable)
);
