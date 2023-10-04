CREATE    EXTENSION IF NOT EXISTS citext
WITH      SCHEMA public;

CREATE    TABLE IF NOT EXISTS users (
          id bigint PRIMARY KEY DEFAULT public.next_snowflake (),
          name text NOT NULL CONSTRAINT name_length CHECK (
          CHAR_LENGTH(name) <= 32
AND       CHAR_LENGTH(name) >= 3
          ),
          username citext NOT NULL CONSTRAINT username_constraint CHECK (username ~* '^[\w_]{3,24}$'),
          email citext NOT NULL UNIQUE CONSTRAINT email_length CHECK (
          CHAR_LENGTH(email) <= 300
AND       CHAR_LENGTH(email) >= 3
          ),
          email_verified bool NOT NULL DEFAULT FALSE,
          password text,
          bio text NOT NULL DEFAULT '' CONSTRAINT bio_length CHECK (CHAR_LENGTH(bio) <= 256),
          -- Rendered bio can expanded as it is converted from markdown to HTML string
          rendered_bio rendered_markdown_text CONSTRAINT rendered_bio CHECK (CHAR_LENGTH(rendered_bio) <= 512),
          location text NOT NULL DEFAULT '' CONSTRAINT location_length CHECK (CHAR_LENGTH(location) <= 36),
          wpm smallint NOT NULL DEFAULT 225 CONSTRAINT wpm_size CHECK (
          wpm <= 320
AND       wpm >= 70
          ),
          avatar_id asset_key,
          banner_id asset_key,
          avatar_hex hex_color,
          banner_hex hex_color,
          is_private bool NOT NULL DEFAULT FALSE,
          public_flags unsigned_int32 NOT NULL DEFAULT 0,
          -- Stats
          follower_count unsigned_int32 NOT NULL DEFAULT 0,
          following_count unsigned_int32 NOT NULL DEFAULT 0,
          friend_count unsigned_int32 NOT NULL DEFAULT 0,
          story_count unsigned_int32 NOT NULL DEFAULT 0,
          -- Third-party login credentials
          login_apple_id text CONSTRAINT login_apple_id_length CHECK (CHAR_LENGTH(login_apple_id) <= 256),
          login_google_id text CONSTRAINT login_google_id_length CHECK (CHAR_LENGTH(login_google_id) <= 256),
          -- Multi-factor auth
          mfa_enabled bool NOT NULL DEFAULT FALSE,
          mfa_secret text,
          -- Timestamps
          created_at timestamptz NOT NULL DEFAULT NOW(),
          username_modified_at timestamptz,
          deleted_at timestamptz
          );

CREATE UNIQUE INDEX unique_username_on_users ON users (username);
