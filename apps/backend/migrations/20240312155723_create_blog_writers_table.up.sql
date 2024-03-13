CREATE TABLE IF NOT EXISTS blog_writers
(
	id             BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	transmitter_id BIGINT
							   REFERENCES users (id)
								   ON DELETE SET NULL, -- Set to NULL as this is only used on insert
	receiver_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	blog_id        BIGINT      NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at    TIMESTAMPTZ,
	deleted_at     TIMESTAMPTZ,
	UNIQUE (receiver_id, blog_id)
);

CREATE INDEX accepted_at_on_blog_writers ON blog_writers (accepted_at);
