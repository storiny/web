INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com');

INSERT INTO
	stories (id, user_id, view_count, published_at, deleted_at)
VALUES (4, 1, 0, '2024-01-01'::TIMESTAMPTZ, NULL),
	   (5, 1, 15, '2024-01-01'::TIMESTAMPTZ, NOW()),
	   (6, 1, 5, '2024-01-01'::TIMESTAMPTZ - INTERVAL '45 days', NULL),
	   (7, 1, 45, NOW() - INTERVAL '120 days', NULL),
	   (DEFAULT, 2, 25, NOW(), NOW());

INSERT INTO
	story_reads (hostname, country_code, duration, user_id, story_id, created_at)
VALUES (NULL, 'AQ', 60, 1, 4, NOW() - INTERVAL '120 days'),
	   ('example.com', NULL, 180, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '45 days'),
	   ('bing.com', 'IN', 96, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '45 days'),
	   ('bing.com', 'IN', 32, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '35 days'),
	   ('bing.com', 'IN', 93, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '32 days'),
	   ('bing.com', 'IN', 39, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '40 days'),
	   ('bing.com', 'IN', 23, 2, 4, '2024-01-01'::TIMESTAMPTZ - INTERVAL '50 days'),
	   ('google.com', 'IN', 94, 2, 4, '2024-01-01'::TIMESTAMPTZ),
	   ('google.com', 'IN', 129, 2, 4, '2024-01-02'::TIMESTAMPTZ),
	   ('bing.com', 'IN', 34, 2, 4, '2024-01-10'::TIMESTAMPTZ),
	   (NULL, 'IN', 46, 2, 4, '2024-01-01'::TIMESTAMPTZ),
	   (NULL, 'IN', 30, 2, 4, '2024-01-12'::TIMESTAMPTZ),
	   (NULL, 'IN', 49, 2, 4, '2024-01-01'::TIMESTAMPTZ),
	   (NULL, 'IN', 219, 2, 4, '2024-01-14'::TIMESTAMPTZ),
	   (NULL, 'IN', 92, 2, 4, '2024-01-15'::TIMESTAMPTZ),
	   (NULL, 'IN', 34, 2, 4, '2024-01-16'::TIMESTAMPTZ),
	   (NULL, 'IN', 49, 2, 4, '2024-01-01'::TIMESTAMPTZ),
	   ('bing.com', NULL, 122, 2, 4, NOW()),
	   ('bing.com', NULL, 301, 3, 4, NOW()),
	   (NULL, NULL, 23, 3, 4, '2024-01-01'::TIMESTAMPTZ),
	   (NULL, NULL, 10, 3, 6, '2024-01-01'::TIMESTAMPTZ),
	   ('google.com', 'AQ', 120, 1, 4, NOW());
