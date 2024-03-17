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
	   (7, 'four', 'sample-story-4', 1, NOW(), NOW()),
	   (8, 'five', 'sample-story-5', 2, NOW(), NOW()),
	   (9, 'six', 'sample-story-6', 2, NOW(), NOW()),
	   (10, 'seven', 'sample-story-7', 1, NOW(), NOW());

INSERT INTO
	blog_stories (story_id, blog_id, accepted_at, created_at)
VALUES (4, 3, NOW() - INTERVAL '2 days', NOW()),
	   (5, 3, NOW() - INTERVAL '3 days', NOW()),
	   (6, 3, NULL, NOW()),
	   (7, 3, NOW(), NOW()),
	   (8, 3, NOW() - INTERVAL '4 days', NOW()),
	   (9, 3, NULL, NOW()),
	   (10, 3, NULL, NOW());
