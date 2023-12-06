INSERT
	INTO
	users (name, username, email)
SELECT next_snowflake()::TEXT,
	   next_snowflake()::TEXT,
	   UUID_GENERATE_V4() || '@example.com'
FROM
	GENERATE_SERIES(1, 5);

INSERT
	INTO
	user_statuses (user_id, expires_at)
SELECT id,
	   NOW() - INTERVAL '7 days'
FROM
	users;