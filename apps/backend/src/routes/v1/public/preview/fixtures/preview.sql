WITH inserted_user AS (
	INSERT INTO users (name, username, email) VALUES ('Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (id, slug, user_id, published_at)
VALUES (2, 'sample-story', (SELECT id FROM inserted_user), NOW());