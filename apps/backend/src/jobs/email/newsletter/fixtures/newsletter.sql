INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user 1', 'one', 'test_user_1@example.com');

INSERT INTO
	assets (key, hex, height, width, user_id)
VALUES ('f4fd9bb4-f81b-454e-83f7-76cad3eba176', '000000', 0, 0, 1);

INSERT INTO
	blogs (id, name, slug, logo_id, logo_hex, user_id)
VALUES (2, 'Test blog', 'test-blog', 'f4fd9bb4-f81b-454e-83f7-76cad3eba176', '000000', 1);

INSERT INTO
	stories (id, title, slug, description, splash_id, splash_hex, word_count, published_at, user_id)
VALUES (3, 'Some story', 'test-story', 'Test description', 'f4fd9bb4-f81b-454e-83f7-76cad3eba176', '000000', 6653,
		NOW(), 1);

INSERT INTO
	blog_stories
	(story_id, blog_id, accepted_at)
VALUES (3, 2, NOW());

INSERT INTO
	subscribers (blog_id, email)
VALUES (2, 'subscriber-1@example.com'),
	   (2, 'subscriber-2@example.com'),
	   (2, 'subscriber-3@example.com');
