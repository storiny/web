INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com'),
	   (4, 'Sample user 4', 'sample_user_4', 'sample.4@example.com'),
	   (5, 'Sample user 5', 'sample_user_5', 'sample.5@example.com');

INSERT INTO
	relations (follower_id, followed_id, created_at, subscribed_at)
VALUES (2, 1, NOW(), NOW()),
	   (3, 1, NOW() - INTERVAL '45 days', NULL),
	   (4, 1, NOW() - INTERVAL '120 days', NULL);
