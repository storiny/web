INSERT
	INTO
	tags (name, story_count)
SELECT next_snowflake()::TEXT,
	   1
FROM
	GENERATE_SERIES(1, 125700);