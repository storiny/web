CREATE TABLE IF NOT EXISTS blog_lsb_items
(
	id       BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
	name     TEXT     NOT NULL
		CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 32 AND CHAR_LENGTH(name) >= 1),
	target   TEXT     NOT NULL
		CONSTRAINT target_length CHECK ((target = '/') OR
										(CHAR_LENGTH(target) <= 1024 AND CHAR_LENGTH(target) >= 6)),
	icon     UUID     REFERENCES assets (key) ON UPDATE CASCADE ON DELETE SET NULL,
	blog_id  BIGINT   NOT NULL
		REFERENCES blogs (id)
			ON DELETE CASCADE,
	priority SMALLINT NOT NULL
		CONSTRAINT priority_value CHECK (priority IN (1, 2, 3, 4, 5)),
	UNIQUE (blog_id, priority)
);
