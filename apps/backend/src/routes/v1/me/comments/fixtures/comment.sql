WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (id, slug, user_id, published_at)
VALUES (3, 'sample-story', (SELECT id FROM inserted_user), NOW());