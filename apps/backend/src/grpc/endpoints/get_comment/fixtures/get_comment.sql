WITH inserted_user  AS (
	INSERT INTO users (id, name, username, email) VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com')
		RETURNING id
					   ),
	 inserted_story AS (
		 INSERT INTO stories (user_id, slug, published_at)
			 VALUES ((SELECT id FROM inserted_user), 'sample-story', NOW())
			 RETURNING id
					   )
INSERT
INTO
	comments (id, content, user_id, story_id)
VALUES (3, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story));