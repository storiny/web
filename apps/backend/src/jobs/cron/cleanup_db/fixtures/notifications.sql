INSERT
	INTO
	users (id, name, username, email)
VALUES (1, 'Sample user', 'sample_user', 'sample@example.com');

INSERT INTO
	notifications (entity_type, entity_id, notifier_id)
SELECT 0,
	   0,
	   1
FROM
	GENERATE_SERIES(1, 5);
