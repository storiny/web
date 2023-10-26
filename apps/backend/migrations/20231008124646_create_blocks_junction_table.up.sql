CREATE TABLE IF NOT EXISTS blocks
(
	blocker_id BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	blocked_id BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	-- Do not index created_at as we do not allow sorting blocked users
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (blocker_id, blocked_id)
);

