-- interface StoryOptionalProps {
--   user?: User;
-- }
-- export type Story = {
--   age_restriction: StoryAgeRestriction;
--   license: StoryLicense;
--   tags: Tag[];
--   user_id: string;
-- } & StoryStats &

CREATE    TABLE IF NOT EXISTS stories (
          id bigint PRIMARY KEY DEFAULT public.next_snowflake (),
          title text NOT NULL DEFAULT 'Untitled story' CONSTRAINT title_length CHECK (
          CHAR_LENGTH(title) <= 96
AND       CHAR_LENGTH(title) >= 1
          ),
          slug text,
          description text CONSTRAINT description_length CHECK (CHAR_LENGTH(description) <= 256),
          splash_id asset_key,
          splash_hex hex_color,
          doc_key text NOT NULL UNIQUE, -- S3 doc key
          category story_category NOT NULL DEFAULT 'others'::story_category,
          -- SEO
          seo_title text CONSTRAINT seo_title_length CHECK (CHAR_LENGTH(seo_title) <= 54),
          seo_description text CONSTRAINT seo_description_length CHECK (CHAR_LENGTH(seo_description) <= 160),
          canonical_url text CONSTRAINT canonical_url_length CHECK (CHAR_LENGTH(canonical_url) <= 1024),
          preview_image asset_key,
          -- Stats (use bigints)
          word_count unsigned_int32 NOT NULL DEFAULT 0,
          read_count unsigned_int64 NOT NULL DEFAULT 0,
          like_count unsigned_int64 NOT NULL DEFAULT 0,
          comment_count unsigned_int64 NOT NULL DEFAULT 0,
          -- Settings
          disable_public_revision_history bool NOT NULL DEFAULT false,
          disable_comments bool NOT NULL DEFAULT false,
          disable_toc bool NOT NULL DEFAULT false,
          visibility smallint NOT NULL DEFAULT 2, -- Public by default
          age_restriction smallint NOT NULL DEFAULT 1, -- Not rated by default
          -- Timestamps
          created_at timestamptz NOT NULL DEFAULT NOW(),
          first_published_at timestamptz,
          published_at timestamptz,
          edited_at timestamptz,
          deleted_at timestamptz
          );

CREATE UNIQUE INDEX unique_slug_on_stories ON stories (slug);
