-- Stories

WITH inserted_user AS (
	INSERT INTO users (name, username, email) VALUES ('Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (user_id, slug, published_at)
SELECT (SELECT id FROM inserted_user),
	   uuid_generate_v4(),
	   NOW()
FROM
	GENERATE_SERIES(1, 125700);

-- Users

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

-- Tags

INSERT
	INTO
	tags (name, story_count)
SELECT next_snowflake()::TEXT,
	   1
FROM
	GENERATE_SERIES(1, 125700);