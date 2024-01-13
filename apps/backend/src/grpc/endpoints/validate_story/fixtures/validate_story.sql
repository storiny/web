INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	stories (id, title, slug, user_id, first_published_at, published_at)
VALUES (3, 'Some story', 'some-story', 2, NOW(), NOW());
