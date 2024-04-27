WITH inserted_user AS (
	INSERT INTO users (name, username, email) VALUES ('Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
					  )
INSERT
INTO
	tokens (id, type, user_id, expires_at)
SELECT uuid_generate_v4(),
	   0,
	   (SELECT id FROM inserted_user),
	   NOW() - INTERVAL '7 days'
FROM
	GENERATE_SERIES(1, 5);
