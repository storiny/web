WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'One', 'one', 'one@example.com'),
														 (2, 'Two', 'two', 'two@example.com'),
														 (3, 'Three', 'three', 'three@example.com'),
														 (4, 'Four', 'four', 'four@example.com')
					  ),
	 inserted_blog AS (
		 INSERT INTO blogs (id, name, slug, user_id)
			 VALUES (5, 'Sample blog', 'sample-blog', 1)
					  )
INSERT
INTO
	blog_editors (user_id, blog_id, accepted_at)
VALUES (2, 5, NOW()),
	   (3, 5, NULL),
	   (4, 5, NOW());