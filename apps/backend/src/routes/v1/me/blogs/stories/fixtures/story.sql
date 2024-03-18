INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'test_user_1', 'user.1@example.com'),
	   (2, 'Sample user 2', 'test_user_2', 'user.2@example.com');

INSERT INTO
	stories (id, user_id)
VALUES (3, 2);

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (4, 'Sample blog', 'sample-blog-1', 1);

INSERT INTO
	blog_editors (user_id, blog_id, accepted_at)
VALUES (2, 4, NOW());