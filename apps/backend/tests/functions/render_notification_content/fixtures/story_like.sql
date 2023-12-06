INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	stories (id, user_id, title, slug, published_at)
VALUES (3, 1, 'Sample story', 'sample-story', NOW());

INSERT INTO
	story_likes (user_id, story_id)
VALUES (2, 3);

INSERT INTO
	notifications (id, entity_type, entity_id, notifier_id)
VALUES (5, 9, 3, 2);

INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (1, 5);
