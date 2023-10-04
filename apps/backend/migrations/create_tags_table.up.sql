CREATE    TABLE IF NOT EXISTS tags (
          id bigint PRIMARY KEY DEFAULT public.next_snowflake (),
          name text NOT NULL CONSTRAINT name_length CHECK (
          CHAR_LENGTH(name) <= 32
AND       CHAR_LENGTH(name) >= 1
          ),
          -- Stats
          follower_count unsigned_int32 NOT NULL DEFAULT 0,
          story_count unsigned_int32 NOT NULL DEFAULT 0,
          -- Timestamps
          created_at timestamptz NOT NULL DEFAULT NOW()
          );

CREATE UNIQUE INDEX unique_name_on_tags ON tags (name);
