WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'One', 'one', 'one@example.com'),
														 (2, 'Two', 'two', 'two@example.com'),
														 (3, 'Three', 'three', 'three@example.com')
						 ),
	 inserted_tags    AS (
		 INSERT INTO tags (id, name)
			 VALUES (4, 'one'),
					(5, 'two')
						 ),
	 inserted_stories AS (
		 INSERT
			 INTO
				 stories (id, category, user_id, published_at, first_published_at)
				 VALUES (6, 'diy'::story_category, 1, NOW(), NOW()),
						(7, 'diy'::story_category, 2, NOW(), NOW()),
						(8, 'diy'::story_category, 3, NOW(), NOW())
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (6, 4),
	   (6, 5),
	   (7, 4),
	   (8, 4),
	   (8, 5);