INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Target profile', 'target_user', 'target.profile@example.com');

INSERT INTO
	user_statuses (user_id, text, emoji)
VALUES (2, 'Some status', '1f90c');

INSERT INTO
	connections (provider, provider_identifier, display_name, user_id)
VALUES (0, 'some-id', 'Some connection', 2);