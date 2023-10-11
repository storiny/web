CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS users(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    name TEXT NOT NULL CONSTRAINT name_length CHECK (char_length(NAME) <= 32 AND char_length(NAME) >= 3),
    username TEXT NOT NULL UNIQUE CONSTRAINT username_constraint CHECK (username ~ '^[a-z0-9_]{3,24}$'),
    email citext NOT NULL UNIQUE CONSTRAINT email_length CHECK (char_length(email) <= 300 AND char_length(email) >= 3),
    email_verified BOOL NOT NULL DEFAULT FALSE,
    password text,
    bio TEXT NOT NULL DEFAULT '' CONSTRAINT bio_length CHECK (char_length(bio) <= 256),
    -- Rendered bio can expand as it gets converted from markdown to HTML string
    rendered_bio rendered_markdown_text CONSTRAINT rendered_bio CHECK (char_length(rendered_bio) <= 512),
    location TEXT NOT NULL DEFAULT '' CONSTRAINT location_length CHECK (char_length(location) <= 36),
    wpm SMALLINT NOT NULL DEFAULT 225 CONSTRAINT wpm_size CHECK (wpm <= 320 AND wpm >= 70),
    avatar_id asset_key,
    banner_id asset_key,
    avatar_hex hex_color,
    banner_hex hex_color,
    public_flags unsigned_int32 NOT NULL DEFAULT 0,
    -- Stats
    follower_count unsigned_int32 NOT NULL DEFAULT 0,
    following_count unsigned_int32 NOT NULL DEFAULT 0,
    friend_count unsigned_int32 NOT NULL DEFAULT 0,
    story_count unsigned_int32 NOT NULL DEFAULT 0,
    -- Privacy settings
    is_private BOOL NOT NULL DEFAULT FALSE,
    incoming_friend_requests SMALLINT NOT NULL DEFAULT 1, -- 1 (everyone) by default
    following_list_visibility SMALLINT NOT NULL DEFAULT 0, -- 0 (everyone) by default
    friend_list_visibility SMALLINT NOT NULL DEFAULT 0, -- 0 (everyone) by default
    disable_read_history BOOL NOT NULL DEFAULT FALSE,
    -- Third-party login credentials
    login_apple_id TEXT CONSTRAINT login_apple_id_length CHECK (char_length(login_apple_id) <= 256),
    login_google_id TEXT CONSTRAINT login_google_id_length CHECK (char_length(login_google_id) <= 256),
    -- Multi-factor auth
    mfa_enabled BOOL NOT NULL DEFAULT FALSE,
    mfa_secret TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    username_modified_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX follower_count_on_users ON users(follower_count);

CREATE INDEX deleted_at_on_users ON users(deleted_at);

