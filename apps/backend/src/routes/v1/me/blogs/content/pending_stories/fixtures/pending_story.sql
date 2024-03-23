INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'test_user_1', 'test_user_1@example.com'),
	   (2, 'Test user 2', 'test_user_2', 'test_user_2@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (3, 'Test blog', 'test-blog', 2);

INSERT INTO
	blog_editors (user_id, blog_id, accepted_at)
VALUES (1, 3, NOW());

INSERT INTO
	stories (id, title, slug, user_id, first_published_at, published_at)
VALUES (4, 'one', 'sample-story-1', 2, NOW(), NOW()),
	   (5, 'two', 'sample-story-2', 1, NOW(), NOW()),
	   (6, 'three', 'sample-story-3', 2, NOW(), NOW()),
	   (7, 'four', NULL, 1, NULL, NULL),
	   (8, 'five', NULL, 2, NULL, NULL),
	   (9, 'six', NULL, 2, NULL, NULL),
	   (10, 'seven', NULL, 1, NULL, NULL);

INSERT INTO
	blog_stories (story_id, blog_id, accepted_at, created_at)
VALUES (4, 3, NULL, NOW() - INTERVAL '2 days'),
	   (5, 3, NULL, NOW() - INTERVAL '3 days'),
	   (6, 3, NOW(), NOW()),
	   (7, 3, NULL, NOW()),
	   (8, 3, NULL, NOW() - INTERVAL '4 days'),
	   (9, 3, NOW(), NOW()),
	   (10, 3, NOW(), NOW());
