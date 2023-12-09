WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						 ),
	 inserted_tags    AS (
		 INSERT INTO tags (id, name) VALUES (2, 'two'), (3, 'three')
						 ),
	 inserted_stories AS (
		 INSERT
			 INTO
				 stories (id, slug, user_id, published_at, first_published_at)
				 VALUES (4, 'sample-story-1', (SELECT id FROM inserted_user), NOW(), NOW()),
						(5, 'sample-story-2', (SELECT id FROM inserted_user), NOW(), NOW()),
						(6, 'sample-story-3', (SELECT id FROM inserted_user), NOW(), NOW())
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (4, 2),
	   (4, 3),
	   (5, 3),
	   (6, 2),
	   (6, 3);