CREATE TABLE IF NOT EXISTS bookmarks (
    user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    story_id BIGINT REFERENCES stories (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, story_id)
);

CREATE INDEX created_at_on_bookmarks ON bookmarks (created_at);

