WITH
	inserted_user AS (
		INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
			RETURNING id
	)
INSERT
INTO
	stories (user_id, published_at, deleted_at)
VALUES
	-- Published stories
	((SELECT id FROM inserted_user), NOW(), DEFAULT),
	((SELECT id FROM inserted_user), NOW(), DEFAULT),
	-- Deleted stories
	((SELECT id FROM inserted_user), NOW(), NOW()),
	((SELECT id FROM inserted_user), NOW(), NOW())
RETURNING id;