INSERT
	INTO
	users (name, username, email, avatar_id, banner_id)
SELECT next_snowflake()::TEXT,
	   next_snowflake()::TEXT,
	   uuid_generate_v4() || '@example.com',
	   uuid_generate_v4(),
	   uuid_generate_v4()
FROM
	GENERATE_SERIES(1, 125700);