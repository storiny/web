WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						 ),
	 inserted_tag     AS (
		 INSERT INTO tags (name) VALUES ('tag-1') RETURNING id
						 )
		,
	 inserted_stories AS (
		 INSERT
			 INTO
				 stories (id, title, slug, user_id, read_count, published_at, first_published_at)
				 VALUES (2, 'one', 'sample-story-1', (SELECT id FROM inserted_user), 1, NOW(), NOW()),
						(3, 'two', 'sample-story-2', (SELECT id FROM inserted_user), 3, NOW(), NOW()),
						(4, 'three', 'sample-story-3', (SELECT id FROM inserted_user), 2, NOW(), NOW())
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (2, (SELECT id FROM inserted_tag)),
	   (3, (SELECT id FROM inserted_tag)),
	   (4, (SELECT id FROM inserted_tag));