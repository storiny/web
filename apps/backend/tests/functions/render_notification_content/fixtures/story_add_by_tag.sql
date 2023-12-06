INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	tags (id, name)
VALUES (3, 'sample-tag');

INSERT INTO
	stories (id, user_id, title, slug, published_at)
VALUES (4, 1, 'Sample story', 'sample-story', NOW());

INSERT INTO
	story_tags (id, story_id, tag_id)
VALUES (5, 4, 3);

INSERT INTO
	notifications (id, entity_type, entity_id, notifier_id)
VALUES (6, 11, 5, 1);

INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (2, 6);
