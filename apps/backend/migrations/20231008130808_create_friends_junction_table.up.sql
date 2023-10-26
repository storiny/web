CREATE TABLE IF NOT EXISTS friends
(
	transmitter_id BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	receiver_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	-- Do not index created_at as we do not allow sorting friends based
	-- on the time the request was sent
	created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at    TIMESTAMPTZ,
	deleted_at     TIMESTAMPTZ,
	PRIMARY KEY (transmitter_id, receiver_id)
);

CREATE INDEX accepted_at_on_friends ON friends (accepted_at);

