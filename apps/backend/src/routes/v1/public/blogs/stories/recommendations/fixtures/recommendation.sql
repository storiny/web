WITH inserted_user         AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
							  ),
	 inserted_blog         AS (
		 INSERT INTO blogs (id, name, slug, user_id)
			 VALUES (2, 'Sample blog', 'sample-blog', (SELECT id FROM inserted_user))
			 RETURNING id
							  ),
	 inserted_tags         AS (
		 INSERT INTO tags (id, name) VALUES (3, 'three'), (4, 'four')
							  ),
	 inserted_stories      AS (
		 INSERT
			 INTO
				 stories (id, slug, user_id, published_at, first_published_at)
				 VALUES (5, 'sample-story-1', (SELECT id FROM inserted_user), NOW(), NOW()),
						(6, 'sample-story-2', (SELECT id FROM inserted_user), NOW(), NOW()),
						(7, 'sample-story-3', (SELECT id FROM inserted_user), NOW(), NOW())
							  ),
	 inserted_blog_stories AS (
		 INSERT INTO blog_stories (blog_id, story_id, accepted_at)
			 VALUES ((SELECT id FROM inserted_blog), 5, NOW()),
					((SELECT id FROM inserted_blog), 6, NOW()),
					((SELECT id FROM inserted_blog), 7, NULL)
							  )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (5, 3),
	   (5, 4),
	   (6, 4),
	   (7, 3),
	   (7, 4);