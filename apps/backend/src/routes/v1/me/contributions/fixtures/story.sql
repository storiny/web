INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'test_user_1', 'test_user_1@example.com');

INSERT INTO
	stories (id, title, slug, user_id, first_published_at, published_at)
VALUES (2, 'one', 'sample-story-1', 1, NOW(), NOW()),
	   (3, 'two', 'sample-story-2', 1, NOW(), NOW());
