CREATE TABLE IF NOT EXISTS mutes
(
	muter_id   BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	muted_id   BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	-- Do not index created_at as we do not allow sorting muted users
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMPTZ,
	PRIMARY KEY (muter_id, muted_id)
);

