INSERT INTO
	users(id, name, username, email)
VALUES (1, 'Test user', 'test_user', 'test_user@example.com');

INSERT INTO
	assets (key, hex, height, width, user_id)
VALUES ('f4fd9bb4-f81b-454e-83f7-76cad3eba176', '000000', 0, 0, 1);

UPDATE users
SET
	avatar_id  = 'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
	avatar_hex = '000000'
WHERE
	id = 1;

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
VALUES (3, 2, '2024-02-15'::TIMESTAMPTZ);

INSERT INTO
	subscribers (blog_id, email, created_at)
VALUES (2, 'subscriber-1@example.com', NOW()),
	   (2, 'subscriber-2@example.com', NOW() - INTERVAL '5 days'),
	   (2, 'subscriber-3@example.com', NOW() - INTERVAL '1 year');
