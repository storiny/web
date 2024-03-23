-- Users
INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Some user 1', 'some_user_1', 'someone.1@example.com'),
	   (2, 'Some user 2', 'some_user_2', 'someone.2@example.com'),
	   (3, 'Some user 3', 'some_user_3', 'someone.3@example.com'),
	   (4, 'Some user 4', 'some_user_4', 'someone.4@example.com');

-- Blog
INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (5, 'Sample blog', 'sample-blog', 1);

-- Insert writers
INSERT INTO
	blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES (1, 2, 5, NOW()),
	   (1, 3, 5, NOW()),
	   (1, 4, 5, NOW());

-- Stories
INSERT INTO
	stories (id, user_id, slug, published_at, first_published_at)
VALUES (6, 1, 'story-1', NOW(), NOW()),
	   (7, 2, 'story-2', NOW(), NOW()),
	   (8, 3, 'story-3', NOW(), NOW()),
	   (9, 4, 'story-4', NOW(), NOW());

-- Tags
INSERT INTO
	tags (id, name)
VALUES (10, 'some-tag-1'),
	   (11, 'some-tag-2'),
	   (12, 'some-tag-3'),
	   (13, 'some-tag-4');

-- Story tags
INSERT INTO
	story_tags (story_id, tag_id)
VALUES (6, 10),
	   (6, 13),
	   (8, 11),
	   (8, 12),
	   (8, 13),
	   (9, 10);

-- Blog stories
INSERT INTO
	blog_stories (story_id, blog_id, accepted_at)
VALUES (6, 5, '2022-01-05'::timestamptz),
	   (7, 5, NULL),
	   (8, 5, '2023-12-21'::timestamptz),
	   (9, 5, '2023-11-15'::timestamptz);