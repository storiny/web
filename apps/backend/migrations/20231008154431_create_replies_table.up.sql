CREATE TABLE IF NOT EXISTS replies
(
	id               BIGINT PRIMARY KEY      DEFAULT public.next_snowflake(),
	content          TEXT           NOT NULL
		CONSTRAINT content_length CHECK (CHAR_LENGTH(content) >= 1 AND CHAR_LENGTH(content) <= 1024),
	-- Rendered content can expand as it gets converted from markdown to HTML string
	rendered_content rendered_markdown_text
		CONSTRAINT rendered_bio CHECK (CHAR_LENGTH(rendered_content) <= 2048),
	hidden           BOOL           NOT NULL DEFAULT FALSE,
	user_id          BIGINT         NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	comment_id       BIGINT         NOT NULL
		REFERENCES comments (id)
			ON DELETE CASCADE,
	-- Stats
	like_count       unsigned_int32 NOT NULL DEFAULT 0,
	-- Timestamps
	created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
	edited_at        TIMESTAMPTZ,
	deleted_at       TIMESTAMPTZ,
	-- FTS
	search_vec       TSVECTOR GENERATED ALWAYS AS (TO_TSVECTOR('english', "content")) STORED
);

CREATE INDEX user_id_on_replies ON replies (user_id);

CREATE INDEX comment_id_on_replies ON replies (comment_id);

CREATE INDEX like_count_on_replies ON replies (like_count);

CREATE INDEX created_at_on_replies ON replies (created_at);

