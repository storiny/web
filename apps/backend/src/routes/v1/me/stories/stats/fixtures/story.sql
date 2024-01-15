INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com');

INSERT INTO
	stories (id, user_id, view_count, published_at)
VALUES (4, 1, 25, NOW());

INSERT INTO
	comments (user_id, story_id, content, created_at)
VALUES (1, 4, '-', NOW()),
	   (3, 4, '-', NOW()),
	   (2, 4, '-', NOW() - INTERVAL '45 days'),
	   (1, 4, '-', NOW() - INTERVAL '120 days');

INSERT INTO
	story_likes (user_id, story_id, created_at)
VALUES (1, 4, NOW()),
	   (2, 4, NOW() - INTERVAL '45 days'),
	   (3, 4, NOW() - INTERVAL '120 days');

INSERT INTO
	story_reads (hostname, country_code, device, duration, user_id, story_id, created_at)
VALUES (NULL, 'AQ', 1, 60, 1, 4, NOW() - INTERVAL '120 days'),
	   ('example.com', NULL, 1, 180, 2, 4, NOW() - INTERVAL '45 days'),
	   ('bing.com', 'IN', 1, 96, 2, 4, NOW() - INTERVAL '45 days'),
	   ('bing.com', 'IN', 2, 32, 2, 4, NOW() - INTERVAL '35 days'),
	   ('bing.com', 'IN', 2, 93, 2, 4, NOW() - INTERVAL '32 days'),
	   ('bing.com', 'IN', 1, 39, 2, 4, NOW() - INTERVAL '40 days'),
	   ('bing.com', 'IN', 1, 23, 2, 4, NOW() - INTERVAL '50 days'),
	   ('google.com', 'IN', 1, 94, 2, 4, NOW()),
	   ('google.com', 'IN', 1, 129, 2, 4, NOW()),
	   ('bing.com', 'IN', 1, 34, 2, 4, NOW() - INTERVAL '58 days'),
	   (NULL, 'IN', 1, 46, 2, 4, NOW()),
	   (NULL, 'IN', 1, 30, 2, 4, NOW()),
	   (NULL, 'IN', 1, 49, 2, 4, NOW()),
	   (NULL, 'IN', 3, 219, 2, 4, NOW()),
	   (NULL, 'IN', 1, 92, 2, 4, NOW()),
	   (NULL, 'IN', 1, 34, 2, 4, NOW()),
	   (NULL, 'IN', 3, 49, 2, 4, NOW()),
	   ('bing.com', NULL, 1, 122, 2, 4, NOW()),
	   ('bing.com', NULL, 1, 301, 3, 4, NOW()),
	   (NULL, NULL, 1, 23, 3, 4, NOW()),
	   (NULL, NULL, 1, 10, 3, 4, NOW()),
	   ('google.com', 'AQ', 1, 120, 1, 4, NOW());
