INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'test_user_1', 'user.1@example.com'),
	   (2, 'Sample user 2', 'test_user_2', 'user.2@example.com');

INSERT INTO
	stories (id, title, slug, user_id, published_at)
VALUES (3, 'Sample story', 'sample-story-1', 1, NOW());
