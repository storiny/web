WITH inserted_users AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Editor 1', 'editor_1', 'editor_1@example.com'),
			   (2, 'Editor 2', 'editor_2', 'editor_2@example.com'),
			   (3, 'Editor 3', 'editor_3', 'editor_3@example.com'),
			   (4, 'Editor 4', 'editor_4', 'editor_4@example.com'),
			   (5, 'Editor 5', 'editor_5', 'editor_5@example.com'),
			   (6, 'Editor 6', 'editor_6', 'editor_6@example.com')
					   ),
	 inserted_blog  AS (
		 INSERT INTO blogs (id, name, slug, domain, user_id)
			 VALUES (7, 'Sample blog', 'test-blog', 'test.com', 1)
			 RETURNING id
					   )
INSERT
INTO
	blog_editors (user_id, blog_id)
VALUES (2, (SELECT id FROM inserted_blog)),
	   (3, (SELECT id FROM inserted_blog)),
	   (4, (SELECT id FROM inserted_blog)),
	   (5, (SELECT id FROM inserted_blog)),
	   (6, (SELECT id FROM inserted_blog));

-- Accept the requests
UPDATE blog_editors
SET
	accepted_at = NOW()
WHERE
	user_id IN (2, 3, 4);