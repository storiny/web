CREATE TABLE IF NOT EXISTS relations
(
	follower_id   BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	followed_id   BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	subscribed_at TIMESTAMPTZ          DEFAULT NOW(),
	deleted_at    TIMESTAMPTZ,
	PRIMARY KEY (follower_id, followed_id)
);

CREATE INDEX created_at_on_relations ON relations (created_at);
