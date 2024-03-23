INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	blogs (id, name, slug, user_id)
VALUES (3, 'Sample blog', 'sample-blog', 1);

INSERT INTO
	blog_editors (id, user_id, blog_id)
VALUES (4, 2, 3);

INSERT INTO
	notifications (id, entity_type, entity_id, notifier_id)
VALUES (5, 14, 4, 1);

INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (2, 5);
