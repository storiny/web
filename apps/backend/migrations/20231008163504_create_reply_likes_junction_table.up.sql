CREATE TABLE IF NOT EXISTS reply_likes(
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    reply_id BIGINT REFERENCES replies(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, reply_id)
);

