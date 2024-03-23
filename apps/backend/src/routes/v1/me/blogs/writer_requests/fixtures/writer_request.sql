INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'one', 'test_user_1@example.com'),
	   (2, 'Test user 2', 'two', 'test_user_2@example.com'),
	   (3, 'Test user 3', 'three', 'test_user_3@example.com'),
	   (4, 'Test user 4', 'four', 'test_user_4@example.com'),
	   (5, 'Test user 5', 'five', 'test_user_5@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (6, 'Test blog', 'test-blog', 2);

INSERT INTO
	blog_editors (user_id, blog_id, accepted_at)
VALUES (1, 6, NOW());

INSERT INTO
	blog_writers (id, transmitter_id, receiver_id, blog_id, accepted_at, created_at)
VALUES (7, 2, 3, 6, NULL, NOW()),
	   (8, 2, 4, 6, NULL, NOW()),
	   (9, 2, 5, 6, NOW(), NOW());
