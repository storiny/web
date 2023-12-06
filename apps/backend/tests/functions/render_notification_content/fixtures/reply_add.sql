INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

INSERT INTO
	stories (id, user_id, slug, published_at)
VALUES (3, 1, 'sample-story', NOW());

INSERT INTO
	comments (id, content, user_id, story_id)
VALUES (4, 'Comment content', 1, 3);

INSERT INTO
	replies (id, content, user_id, comment_id)
VALUES (5, 'Reply content', 2, 4);

INSERT INTO
	notifications (id, entity_type, entity_id, notifier_id)
VALUES (6, 7, 5, 2);

INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (1, 6);
