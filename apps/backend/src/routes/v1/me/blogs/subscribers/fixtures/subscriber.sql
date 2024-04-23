INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'one', 'test_user_1@example.com'),
	   (2, 'Test user 2', 'two', 'test_user_2@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (3, 'Test blog', 'test-blog', 1);

INSERT INTO
	subscribers (blog_id, email)
VALUES (3, 'subscriber-1@example.com'),
	   (3, 'subscriber-2@example.com'),
	   (3, 'subscriber-3@example.com');
