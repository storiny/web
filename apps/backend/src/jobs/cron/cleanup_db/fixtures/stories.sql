-- Insert a single story with a predefined user_id for tests
WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user),
		uuid_generate_v4(),
		NOW());

WITH inserted_user AS (
	INSERT INTO users (name, username, email) VALUES ('Sample user 2', 'sample_user_2', 'sample.2@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (user_id, slug, published_at)
SELECT (SELECT id FROM inserted_user),
	   uuid_generate_v4(),
	   NOW()
FROM
	GENERATE_SERIES(1, 4);

UPDATE stories
SET
	deleted_at = NOW() - INTERVAL '60 days';