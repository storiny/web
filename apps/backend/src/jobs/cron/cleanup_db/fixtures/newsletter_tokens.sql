WITH inserted_user AS (
	INSERT INTO users (name, username, email) VALUES ('Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
					  ),
	 inserted_blog AS (
		 INSERT INTO blogs (name, slug, user_id)
			 VALUES ('Sample blog', 'sample-blog', (SELECT id FROM inserted_user))
			 RETURNING id
					  )
INSERT
INTO
	newsletter_tokens (id, email, blog_id, expires_at)
SELECT uuid_generate_v4(),
	   uuid_generate_v4() || '@example.com',
	   (SELECT id FROM inserted_blog),
	   NOW() - INTERVAL '7 days'
FROM
	GENERATE_SERIES(1, 5);
