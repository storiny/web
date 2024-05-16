WITH inserted_user AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
					  ),
	 inserted_blog AS (
		 INSERT INTO blogs (id, name, slug, domain, user_id)
			 VALUES (2, 'Sample blog', 'test-blog', 'test.com', 1)
			 RETURNING id
					  )
INSERT
INTO
	subscribers (email, blog_id)
VALUES ('subscriber-1@example.com', (SELECT id FROM inserted_blog)),
	   ('subscriber-2@example.com', (SELECT id FROM inserted_blog)),
	   ('subscriber-3@example.com', (SELECT id FROM inserted_blog)),
	   ('subscriber-4@example.com', (SELECT id FROM inserted_blog)),
	   ('subscriber-5@example.com', (SELECT id FROM inserted_blog));
