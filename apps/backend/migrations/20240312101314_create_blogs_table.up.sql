CREATE TABLE IF NOT EXISTS blogs
(
	id                       BIGINT PRIMARY KEY      DEFAULT public.next_snowflake(),
	name                     TEXT           NOT NULL
		CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 32 AND CHAR_LENGTH(name) >= 3),
	slug                     TEXT           NOT NULL UNIQUE
		-- Must contain at-least one non-digit character
		CONSTRAINT slug_constraint CHECK (slug ~ '^[a-z0-9_-]{3,24}$' AND slug ~ '[^\d]'),
	description              TEXT
		CONSTRAINT description_length CHECK (CHAR_LENGTH(description) <= 256),
	domain                   citext UNIQUE
		CONSTRAINT domain_length CHECK (CHAR_LENGTH(domain) <= 256 AND CHAR_LENGTH(domain) >= 3),
	-- Logo
	logo_id                  UUID,
	logo_hex                 hex_color,
	-- Banner
	banner_id                UUID,
	banner_hex               hex_color,
	-- Newsletter splash
	newsletter_splash_id     UUID,
	newsletter_splash_hex    hex_color,
	-- Favicon
	favicon                  UUID           REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	-- Mark
	mark_light               UUID           REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	mark_dark                UUID           REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	-- Fonts
	font_primary             UUID,
	font_secondary           UUID,
	font_code                UUID,
	--
	category                 story_category NOT NULL DEFAULT 'others' ::story_category,
	user_id                  BIGINT
											REFERENCES users (id)
												-- Avoid cascade action as it will result in orphaned objects in S3 (for fonts)
												ON DELETE SET NULL,
	-- SEO
	seo_title                TEXT
		CONSTRAINT seo_title_length CHECK (CHAR_LENGTH(seo_title) <= 54),
	seo_description          TEXT
		CONSTRAINT seo_description_length CHECK (CHAR_LENGTH(seo_description) <= 160),
	preview_image            UUID           REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	-- Sidebars
	rsb_items_label          TEXT           NOT NULL DEFAULT ''
		CONSTRAINT rsb_items_label_length CHECK (CHAR_LENGTH(rsb_items_label) <= 32),
	-- Connections
	website_url              TEXT
		CONSTRAINT website_url_length CHECK (CHAR_LENGTH(website_url) <= 1024),
	public_email             TEXT
		CONSTRAINT public_email_length CHECK (CHAR_LENGTH(public_email) <= 300),
	github_url               TEXT
		CONSTRAINT github_url_length CHECK (CHAR_LENGTH(github_url) <= 1024),
	instagram_url            TEXT
		CONSTRAINT instagram_url_length CHECK (CHAR_LENGTH(instagram_url) <= 1024),
	linkedin_url             TEXT
		CONSTRAINT linkedin_url_length CHECK (CHAR_LENGTH(linkedin_url) <= 1024),
	twitch_url               TEXT
		CONSTRAINT twitch_url_length CHECK (CHAR_LENGTH(twitch_url) <= 1024),
	twitter_url              TEXT
		CONSTRAINT twitter_url_length CHECK (CHAR_LENGTH(twitter_url) <= 1024),
	youtube_url              TEXT
		CONSTRAINT youtube_url_length CHECK (CHAR_LENGTH(youtube_url) <= 1024),
	-- Stats
	editor_count             unsigned_int32 NOT NULL DEFAULT 0,
	writer_count             unsigned_int32 NOT NULL DEFAULT 0,
	follower_count           unsigned_int32 NOT NULL DEFAULT 0,
	-- Settings
	is_homepage_large_layout BOOL           NOT NULL DEFAULT FALSE,
	is_story_minimal_layout  BOOL           NOT NULL DEFAULT FALSE,
	is_external              BOOL           NOT NULL DEFAULT FALSE, -- TRUE if hidden from storiny.com network
	hide_storiny_branding    BOOL           NOT NULL DEFAULT FALSE,
	default_theme            TEXT
		CONSTRAINT default_theme_value CHECK (default_theme IN ('light', 'dark', NULL)),
	force_theme              BOOL           NOT NULL DEFAULT FALSE,
	-- Flags
	has_plus_features        BOOL           NOT NULL DEFAULT FALSE,
	is_active                BOOL           NOT NULL DEFAULT TRUE,
	-- Timestamps
	created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
	deleted_at               TIMESTAMPTZ,
	-- FTS
	search_vec               TSVECTOR GENERATED ALWAYS AS (SETWEIGHT(TO_TSVECTOR('english', "name"), 'A') ||
														   SETWEIGHT(
																   TO_TSVECTOR('english', COALESCE("description", '')),
																   'C')) STORED,
	-- Foreign keys
	FOREIGN KEY (logo_id, logo_hex) REFERENCES assets (key, hex) ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY (banner_id, banner_hex) REFERENCES assets (key, hex) ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY (newsletter_splash_id, newsletter_splash_hex) REFERENCES assets (key, hex) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX follower_count_on_blogs ON blogs (follower_count);

CREATE INDEX created_at_on_blogs ON blogs (created_at);

CREATE INDEX user_id_on_blogs ON blogs (user_id);

CREATE INDEX search_vec_on_blogs ON blogs USING GIN (search_vec);
