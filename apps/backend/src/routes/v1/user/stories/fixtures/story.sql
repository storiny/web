INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user', 'sample_user', 'sample@example.com');

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (2, 'one', 'sample-story-1', 1, 1, NOW() - INTERVAL '60 seconds', NOW() - INTERVAL '60 seconds');

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (3, 'two', 'sample-story-2', 1, 3, NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '30 seconds');

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (4, 'three', 'sample-story-3', 1, 2, NOW(), NOW());
