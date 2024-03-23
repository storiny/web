WITH inserted_users AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'User 1', 'user_1', 'user_1@example.com'),
			   (2, 'User 2', 'user_2', 'user_2@example.com')
					   ),
	 inserted_blogs AS (
		 INSERT INTO blogs (id, name, slug, user_id)
			 VALUES (3, 'Sample blog 1', 'test-blog-1', 2),
					(4, 'Sample blog 2', 'test-blog-2', 2),
					(5, 'Sample blog 3', 'test-blog-3', 2),
					(6, 'Sample blog 4', 'test-blog-4', 2),
					(7, 'Sample blog 5', 'test-blog-5', 2),
					(8, 'Sample blog 6', 'test-blog-6', 2),
					(9, 'Sample blog 7', 'test-blog-7', 2),
					(10, 'Sample blog 8', 'test-blog-8', 2)
			 RETURNING id
					   )
INSERT
INTO
	blog_editors (user_id, blog_id)
VALUES (1, 3),
	   (1, 4),
	   (1, 5),
	   (1, 6);

INSERT
	INTO
	blog_writers (transmitter_id, receiver_id, blog_id)
VALUES (2, 1, 7),
	   (2, 1, 8),
	   (2, 1, 9),
	   (2, 1, 10);

UPDATE blog_editors
SET
	accepted_at = NOW()
WHERE
	blog_id IN (3, 4);

UPDATE blog_writers
SET
	accepted_at = NOW()
WHERE
	blog_id IN (7, 8);
