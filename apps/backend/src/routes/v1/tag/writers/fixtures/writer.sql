WITH inserted_user    AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'One', 'one', 'one@example.com'),
														 (2, 'Two', 'two', 'two@example.com'),
														 (3, 'Three', 'three', 'three@example.com')
						 ),
	 inserted_tags    AS (
		 INSERT INTO tags (id, name)
			 VALUES (4, 'tag-1')
						 ),
	 inserted_stories AS (
		 INSERT
			 INTO
				 stories (id, user_id, published_at, first_published_at)
				 VALUES (5, 1, NOW(), NOW()),
						(6, 2, NOW(), NOW()),
						(7, 3, NOW(), NOW())
						 )
INSERT
INTO
	story_tags (story_id, tag_id)
VALUES (5, 4),
	   (6, 4),
	   (7, 4);