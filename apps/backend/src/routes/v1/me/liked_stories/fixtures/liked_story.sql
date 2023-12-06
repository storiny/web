INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Sample user 2', 'sample_user_2', 'user.2@example.com');

INSERT INTO
	stories (id, title, slug, user_id, published_at)
VALUES (3, 'Unraveling the mysteries of ancient civilizations', 'sample-story-1', 2, NOW());

INSERT INTO
	stories (id, title, slug, user_id, published_at)
VALUES (4, 'Building relationships in a digital world', 'sample-story-2', 2, NOW());

