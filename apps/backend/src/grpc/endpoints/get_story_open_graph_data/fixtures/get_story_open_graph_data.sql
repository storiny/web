INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Story writer', 'story_writer', 'story_writer@example.com');

INSERT INTO
	stories (id, title, slug, user_id, first_published_at, published_at)
VALUES (2, 'Some story', 'some-story', 1, NOW(), NOW());
