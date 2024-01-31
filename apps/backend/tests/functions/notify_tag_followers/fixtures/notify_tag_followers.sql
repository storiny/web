WITH inserted_users     AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
			   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
			   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com'),
			   (4, 'Sample user 4', 'sample_user_4', 'sample.4@example.com')
						   ),
	 inserted_tag       AS (
		 INSERT INTO tags (id, name, story_count)
			 VALUES (4, 'tag-1', 1),
					(5, 'tag-2', 1)
						   ),
	 inserted_story     AS (
		 INSERT INTO stories (id, user_id, slug, published_at)
			 VALUES (6, 1, 'some-story', NOW())
						   ),
	 inserted_story_tag AS (
		 INSERT INTO story_tags (id, story_id, tag_id)
			 VALUES (7, 6, 4), (8, 6, 5)
						   )
INSERT
INTO
	tag_followers (user_id, tag_id)
VALUES (2, 4),
	   (2, 5),
	   (3, 5);