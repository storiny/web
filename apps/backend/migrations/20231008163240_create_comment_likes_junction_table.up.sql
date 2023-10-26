CREATE TABLE IF NOT EXISTS comment_likes
(
	user_id    BIGINT NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	comment_id BIGINT NOT NULL
		REFERENCES comments (id)
			ON DELETE CASCADE,
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (user_id, comment_id)
);

