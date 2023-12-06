INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	user_statuses (user_id, text, emoji)
VALUES (2, 'Some status', '1f90c');

INSERT INTO
	tags (id, name, story_count)
VALUES (4, 'sample', 1);

INSERT INTO
	stories (id, title, slug, description, user_id, first_published_at, published_at)
VALUES (3, 'Some story', 'some-story', 'Some description', 2, NOW(), NOW());

INSERT INTO
	story_tags (story_id, tag_id)
VALUES (3, 4);