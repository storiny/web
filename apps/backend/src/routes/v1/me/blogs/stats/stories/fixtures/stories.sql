INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (4, 'Sample blog', 'sample-blog', 1);

INSERT INTO
	blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES (1, 2, 4, NOW());

INSERT INTO
	stories (id, user_id, view_count, published_at)
VALUES (5, 1, 0, NOW()),
	   (6, 1, 15, NOW()),
	   (7, 1, 5, NOW() - INTERVAL '45 days'),
	   (8, 1, 45, NOW() - INTERVAL '120 days'),
	   (9, 1, 64, NOW() - INTERVAL '60 days'),
	   (10, 2, 25, NULL);

INSERT INTO
	story_reads (hostname, country_code, duration, user_id, story_id, created_at)
VALUES (NULL, 'AQ', 60, 1, 5, NOW() - INTERVAL '120 days'),
	   ('example.com', NULL, 180, 2, 5, NOW() - INTERVAL '45 days'),
	   ('bing.com', 'IN', 96, 2, 5, NOW() - INTERVAL '45 days'),
	   ('bing.com', 'IN', 32, 2, 5, NOW() - INTERVAL '35 days'),
	   ('bing.com', 'IN', 93, 2, 5, NOW() - INTERVAL '32 days'),
	   ('bing.com', 'IN', 39, 2, 5, NOW() - INTERVAL '40 days'),
	   ('bing.com', 'IN', 23, 2, 5, NOW() - INTERVAL '50 days'),
	   ('google.com', 'IN', 94, 2, 5, NOW()),
	   ('google.com', 'IN', 129, 2, 5, NOW()),
	   ('bing.com', 'IN', 34, 2, 5, NOW() - INTERVAL '58 days'),
	   (NULL, 'IN', 46, 2, 5, NOW()),
	   (NULL, 'IN', 30, 2, 5, NOW()),
	   (NULL, 'IN', 49, 2, 5, NOW()),
	   (NULL, 'IN', 219, 2, 5, NOW()),
	   (NULL, 'IN', 92, 2, 5, NOW()),
	   (NULL, 'IN', 34, 2, 5, NOW()),
	   (NULL, 'IN', 49, 2, 5, NOW()),
	   ('bing.com', NULL, 122, 2, 5, NOW()),
	   ('bing.com', NULL, 301, 3, 5, NOW()),
	   (NULL, NULL, 23, 3, 5, NOW()),
	   (NULL, NULL, 10, 3, 7, NOW()),
	   ('google.com', 'AQ', 120, 1, 5, NOW());

INSERT INTO
	blog_stories (story_id, blog_id, accepted_at)
VALUES (5, 4, NOW()),
	   (6, 4, NOW()),
	   (7, 4, NOW()),
	   (8, 4, NOW()),
	   (9, 4, NULL),
	   (10, 4, NOW());

UPDATE stories
SET
	deleted_at = NOW()
WHERE
	id = 6;
