WITH
	inserted_user AS (
		INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
			RETURNING id
	)
INSERT
INTO
	stories (user_id, deleted_at)
VALUES
	((SELECT id FROM inserted_user), DEFAULT),
	((SELECT id FROM inserted_user), DEFAULT),
	((SELECT id FROM inserted_user), NOW()),
	((SELECT id FROM inserted_user), NOW())
RETURNING id;