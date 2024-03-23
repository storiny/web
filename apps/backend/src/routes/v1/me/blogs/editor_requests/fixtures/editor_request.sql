INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'one', 'test_user_1@example.com'),
	   (2, 'Test user 2', 'two', 'test_user_2@example.com'),
	   (3, 'Test user 3', 'three', 'test_user_3@example.com'),
	   (4, 'Test user 4', 'four', 'test_user_4@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (5, 'Test blog', 'test-blog', 1);

INSERT INTO
	blog_editors (id, user_id, blog_id, accepted_at, created_at)
VALUES (6, 2, 5, NULL, NOW()),
	   (7, 3, 5, NULL, NOW()),
	   (8, 4, 5, NOW(), NOW());
