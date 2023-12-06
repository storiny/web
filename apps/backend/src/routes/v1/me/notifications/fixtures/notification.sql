WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
														 (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com')
					  )
INSERT
INTO
	notifications (id, entity_id, entity_type, notifier_id)
VALUES (4, 2, 4, 2),
	   (5, 3, 5, 3),
	   -- System notification
	   (6, DEFAULT, 0, DEFAULT);
