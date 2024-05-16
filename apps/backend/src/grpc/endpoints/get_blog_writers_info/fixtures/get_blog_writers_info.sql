WITH inserted_users AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Writer 1', 'writer_1', 'writer_1@example.com'),
			   (2, 'Writer 2', 'writer_2', 'writer_2@example.com'),
			   (3, 'Writer 3', 'writer_3', 'writer_3@example.com'),
			   (4, 'Writer 4', 'writer_4', 'writer_4@example.com'),
			   (5, 'Writer 5', 'writer_5', 'writer_5@example.com'),
			   (6, 'Writer 6', 'writer_6', 'writer_6@example.com')
					   ),
	 inserted_blog  AS (
		 INSERT INTO blogs (id, name, slug, domain, user_id)
			 VALUES (7, 'Sample blog', 'test-blog', 'test.com', 1)
			 RETURNING id
					   )
INSERT
INTO
	blog_writers (receiver_id, transmitter_id, blog_id)
VALUES (2, 1, (SELECT id FROM inserted_blog)),
	   (3, 1, (SELECT id FROM inserted_blog)),
	   (4, 1, (SELECT id FROM inserted_blog)),
	   (5, 1, (SELECT id FROM inserted_blog)),
	   (6, 1, (SELECT id FROM inserted_blog));

-- Accept the requests
UPDATE blog_writers
SET
	accepted_at = NOW()
WHERE
	receiver_id IN (2, 3, 4);