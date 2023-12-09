WITH inserted_user     AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						  ),
	 inserted_story    AS (
		 INSERT INTO stories (user_id, published_at)
			 VALUES ((SELECT id FROM inserted_user), NOW())
			 RETURNING id
						  ),
	 inserted_comments AS (
		 INSERT INTO comments (id, content, user_id, story_id)
			 VALUES (2, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story)),
					(DEFAULT, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story))
						  )
INSERT
INTO
	replies (id, content, user_id, comment_id)
VALUES (3, 'Sample content', (SELECT id FROM inserted_user), 2),
	   (DEFAULT, 'Sample content', (SELECT id FROM inserted_user), 2);
