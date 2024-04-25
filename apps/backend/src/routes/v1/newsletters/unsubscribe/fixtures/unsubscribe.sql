INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user', 'one', 'test_user@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (2, 'Test blog', 'test-blog', 1);

INSERT INTO
	subscribers (blog_id, email)
VALUES (2, 'subscriber@example.com');
