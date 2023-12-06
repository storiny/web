INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user', 'sample_user', 'sample@example.com');

INSERT INTO
	stories (id, user_id, first_published_at, published_at)
VALUES (2, 1, NOW(), NOW());

INSERT INTO
	tags (id, name)
VALUES (3, 'tag-0'),
	   (4, 'tag-1');