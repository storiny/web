WITH inserted_users   AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Sample user 1', 'sample_user_1', 'sample_1@example.com'),
			   (2, 'Sample user 2', 'sample_user_2', 'sample_2@example.com')
						 ),
	 inserted_stories AS (
		 INSERT INTO stories (id, user_id)
			 VALUES (3, 2),
					(4, 2),
					(5, 2),
					(6, 2)
						 )
INSERT
INTO
	story_contributors (user_id, story_id, accepted_at)
VALUES
	-- Pending requests
	(1, 3, NULL),
	(1, 4, NULL),
	-- Accepted requests
	(1, 5, NOW()),
	(1, 6, NOW());
