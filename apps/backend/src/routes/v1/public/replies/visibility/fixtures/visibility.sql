WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						 ),
	 inserted_story   AS (
		 INSERT
			 INTO
				 stories (slug, user_id, published_at)
				 VALUES ('sample-story', (SELECT id FROM inserted_user), NOW())
				 RETURNING id
						 ),
	 inserted_comment AS (
		 INSERT
			 INTO
				 comments (content, user_id, story_id)
				 VALUES ('Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story))
				 RETURNING id
						 )
INSERT
INTO
	replies (id, content, user_id, comment_id)
VALUES (2, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_comment));