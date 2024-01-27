INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'test_user_1', 'test_user_1@example.com'),
	   (2, 'Test user 2', 'test_user_2', 'test_user_2@example.com');

INSERT INTO
	stories (id, user_id)
VALUES (3, 1),
	   (4, 1);
