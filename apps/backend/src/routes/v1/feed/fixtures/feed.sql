-- Users
INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Some user 1', 'some_user_1', 'someone.1@example.com'),
	   (3, 'Some user 3', 'some_user_3', 'someone.3@example.com'),
	   (4, 'Some user 4', 'some_user_4', 'someone.4@example.com');

-- Insert a private user
INSERT INTO
	users (id, name, username, email, is_private)
VALUES (2, 'Some user 2', 'some_user_2', 'someone.2@example.com', TRUE);

-- Relations
INSERT INTO
	relations (follower_id, followed_id)
VALUES (1, 2);

-- Friends
INSERT INTO
	friends (transmitter_id, receiver_id, accepted_at)
VALUES (1, 2, NOW()),
	   (1, 3, NOW());

-- Stories
INSERT INTO
	stories (id, user_id, slug, published_at)
VALUES (5, 1, 'story-1', NOW()),
	   (6, 2, 'story-2', NOW()),
	   (7, 3, 'story-3', NOW()),
	   (8, 4, 'story-4', NOW());

-- Tags
INSERT INTO
	tags (id, name)
VALUES (9, 'some-tag-1'),
	   (10, 'some-tag-2'),
	   (11, 'some-tag-3'),
	   (12, 'some-tag-4');

-- Story tags
INSERT INTO
	story_tags (story_id, tag_id)
VALUES (5, 9),
	   (5, 12),
	   (7, 10),
	   (7, 11),
	   (7, 12),
	   (8, 9);

