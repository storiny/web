INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'user.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'user.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'user.3@example.com'),
	   (4, 'Sample user 4', 'sample_user_4', 'user.4@example.com');

INSERT INTO
	stories (id, title, slug, user_id, published_at)
VALUES (5, 'Sample story', 'sample-story-1', 1, NOW());

INSERT INTO
	story_contributors (id, user_id, story_id, role, accepted_at)
VALUES (6, 2, 5, 'viewer', NULL),
	   (7, 3, 5, 'editor', NOW()),
	   (8, 4, 5, 'editor', NOW() - INTERVAL '5 days');

UPDATE users
SET
	deleted_at = NOW()
WHERE
	id = 3;

UPDATE users
SET
	deactivated_at = NOW()
WHERE
	id = 4;
