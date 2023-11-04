CREATE TABLE IF NOT EXISTS reports
(
	id         BIGINT PRIMARY KEY   DEFAULT public.next_snowflake(),
	entity_id  BIGINT      NOT NULL, -- ID of the reported entity
	type       TEXT        NOT NULL,
	reason     TEXT        NOT NULL
		CONSTRAINT reason_length CHECK (CHAR_LENGTH(reason) <= 1024),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

