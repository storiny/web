INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	friends (transmitter_id, receiver_id)
VALUES (1, 2);

INSERT INTO
	notifications (id, entity_type, entity_id, notifier_id)
VALUES (3, 4, 1, 1);

INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (2, 3);
