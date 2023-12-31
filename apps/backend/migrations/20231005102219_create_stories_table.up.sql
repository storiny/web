CREATE TABLE IF NOT EXISTS stories
(
	id                              BIGINT PRIMARY KEY      DEFAULT public.next_snowflake(),
	title                           TEXT           NOT NULL DEFAULT 'Untitled story'
		CONSTRAINT title_length CHECK (CHAR_LENGTH(title) <= 96 AND CHAR_LENGTH(title) >= 1),
	slug                            TEXT UNIQUE,
	description                     TEXT
		CONSTRAINT description_length CHECK (CHAR_LENGTH(description) <= 256),
	splash_id                       UUID,
	splash_hex                      hex_color,
	category                        story_category NOT NULL DEFAULT 'others' ::story_category,
	visibility                      SMALLINT       NOT NULL DEFAULT 2, -- Public by default
	age_restriction                 SMALLINT       NOT NULL DEFAULT 1, -- Not rated by default
	license                         SMALLINT       NOT NULL DEFAULT 1, -- Reserved by default
	user_id                         BIGINT         NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	-- SEO
	seo_title                       TEXT
		CONSTRAINT seo_title_length CHECK (CHAR_LENGTH(seo_title) <= 54),
	seo_description                 TEXT
		CONSTRAINT seo_description_length CHECK (CHAR_LENGTH(seo_description) <= 160),
	canonical_url                   TEXT
		CONSTRAINT canonical_url_length CHECK (CHAR_LENGTH(canonical_url) <= 1024),
	preview_image                   UUID           REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	-- Stats (use bigints)
	word_count                      unsigned_int32 NOT NULL DEFAULT 0,
	view_count                      unsigned_int64 NOT NULL DEFAULT 0,
	-- Replace `unsigned_int32` with `unsigned_int64` when the read count overflows.
	read_count                      unsigned_int32 NOT NULL DEFAULT 0,
	like_count                      unsigned_int32 NOT NULL DEFAULT 0,
	comment_count                   unsigned_int32 NOT NULL DEFAULT 0,
	-- Settings
	disable_public_revision_history BOOL           NOT NULL DEFAULT FALSE,
	disable_comments                BOOL           NOT NULL DEFAULT FALSE,
	disable_toc                     BOOL           NOT NULL DEFAULT FALSE,
	-- Timestamps
	pinned_at                       TIMESTAMPTZ,
	created_at                      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
	first_published_at              TIMESTAMPTZ,
	published_at                    TIMESTAMPTZ,
	edited_at                       TIMESTAMPTZ,
	deleted_at                      TIMESTAMPTZ,
	-- FTS
	search_vec                      TSVECTOR GENERATED ALWAYS AS (SETWEIGHT(TO_TSVECTOR('english', "title"), 'A') ||
																  SETWEIGHT(
																		  TO_TSVECTOR('english', COALESCE("description", '')),
																		  'C')) STORED,
	-- Foreign keys
	FOREIGN KEY (splash_id, splash_hex) REFERENCES assets (key, hex) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX read_count_on_stories ON stories (read_count);

CREATE INDEX like_count_on_stories ON stories (like_count);

CREATE INDEX created_at_on_stories ON stories (created_at);

CREATE INDEX published_at_on_stories ON stories (published_at)
	WHERE
		published_at IS NOT NULL;

CREATE INDEX pinned_at_on_stories ON stories (pinned_at)
	WHERE
		pinned_at IS NOT NULL;

CREATE INDEX user_id_on_stories ON stories (user_id);

CREATE INDEX search_vec_on_stories ON stories USING GIN (search_vec);
