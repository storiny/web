WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						 ),
	 inserted_tags    AS (
		 INSERT INTO tags (id, name)
			 VALUES (2, 'one'),
					(3, 'two')
						 ),
	 inserted_stories AS (
		 INSERT
			 INTO
				 stories (id, category, user_id, published_at, first_published_at)
				 VALUES (4, 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW()),
						(5, 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW()),
						(6, 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW())
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (4, 2),
	   (4, 3),
	   (5, 2),
	   (6, 2),
	   (6, 3);