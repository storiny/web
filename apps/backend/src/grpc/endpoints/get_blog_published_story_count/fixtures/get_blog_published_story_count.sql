WITH inserted_users   AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Editor 1', 'editor_1', 'editor_1@example.com')
						 ),
	 inserted_stories AS (
		 INSERT INTO stories (id, user_id)
			 VALUES (3, 1), (4, 1), (5, 1), (6, 1)
						 ),
	 inserted_blog    AS (
		 INSERT INTO blogs (id, name, slug, domain, user_id)
			 VALUES (2, 'Sample blog', 'test-blog', 'test.com', 1)
			 RETURNING id
						 )
INSERT
INTO
	blog_stories (story_id, blog_id)
VALUES (3, (SELECT id FROM inserted_blog)),
	   (4, (SELECT id FROM inserted_blog)),
	   (5, (SELECT id FROM inserted_blog)),
	   (6, (SELECT id FROM inserted_blog));

-- Accept the requests
UPDATE blog_stories
SET
	accepted_at = NOW()
WHERE
	story_id IN (4, 5, 6);