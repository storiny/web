INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user', 'sample_user', 'sample@example.com');

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (2, 'one', 'sample-story-1', 1, 1, NOW(), NOW());

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (3, 'two', 'sample-story-2', 1, 3, NOW(), NOW());

INSERT
	INTO
	stories (id, title, slug, user_id, read_count, published_at, first_published_at)
VALUES (4, 'three', 'sample-story-3', 1, 2, NOW(), NOW());

INSERT
	INTO
	stories (id, title, user_id)
VALUES (5, 'four', 1);

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (6, 'Sample blog', 'sample-blog', 1);

INSERT INTO
	blog_stories (story_id, blog_id, accepted_at)
VALUES (2, 6, NOW() - INTERVAL '60 seconds'),
	   (3, 6, NOW() - INTERVAL '30 seconds'),
	   (4, 6, NOW()),
	   (5, 6, NULL);