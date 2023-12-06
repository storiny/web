WITH inserted_user AS (
	INSERT INTO users (id, name, username, email)
		VALUES (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
			   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com')
					  )
INSERT
INTO
	stories (user_id, category, published_at)
VALUES (2, 'diy'::story_category, NOW()),
	   (3, 'diy'::story_category, NOW())