WITH
	inserted_user  AS (
		INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
			RETURNING id
	),
	inserted_story AS (
		INSERT INTO stories (id, user_id, published_at)
			VALUES (2, (SELECT id FROM inserted_user), NOW())
			RETURNING id
	)
INSERT
INTO
	comments (hidden, content, user_id, story_id)
VALUES
	(TRUE, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story)),
	(DEfault, 'Sample content', (SELECT id FROM inserted_user), (SELECT id FROM inserted_story));