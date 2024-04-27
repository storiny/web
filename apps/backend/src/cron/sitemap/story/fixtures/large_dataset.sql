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