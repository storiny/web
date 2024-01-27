INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user', 'sample_user', 'user.1@example.com');

INSERT INTO
	stories (id, user_id, published_at)
VALUES (2, 1, NOW());
