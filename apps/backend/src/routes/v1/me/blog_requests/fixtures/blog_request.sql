INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'test_user_1', 'test_user_1@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (2, 'Wellness Wisdom', 'wellness', 1),
	   (3, 'The Green Guru', 'green-guru', 1),
	   (4, 'Geek Gazette', 'geek-gazette', 1),
	   (5, 'RED Cinema', 'red', 1);
