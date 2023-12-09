WITH inserted_user    AS (
	INSERT INTO users (name, username, email)
		VALUES ('Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
						 ),
	 inserted_stories AS (
		 INSERT INTO stories (id, user_id, category, published_at)
			 VALUES (2, (SELECT id FROM inserted_user), 'diy'::story_category, NOW()),
					(3, (SELECT id FROM inserted_user), 'diy'::story_category, NOW())
						 ),
	 inserted_tags    AS (
		 INSERT INTO tags (id, name)
			 VALUES (4, 'one'), (5, 'two'), (6, 'three')
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (2, 4),
	   (2, 5),
	   (3, 4),
	   (3, 5),
	   (3, 6);
