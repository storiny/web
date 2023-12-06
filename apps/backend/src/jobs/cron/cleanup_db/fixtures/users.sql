INSERT
	INTO
	users (name, username, email)
SELECT next_snowflake()::TEXT,
	   next_snowflake()::TEXT,
	   uuid_generate_v4() || '@example.com'
FROM
	GENERATE_SERIES(1, 5);

UPDATE users
SET
	deleted_at = NOW() - INTERVAL '60 days';