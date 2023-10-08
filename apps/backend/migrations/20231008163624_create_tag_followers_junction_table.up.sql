CREATE TABLE IF NOT EXISTS tag_followers(
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX created_at_on_tag_followers ON tag_followers(created_at);

