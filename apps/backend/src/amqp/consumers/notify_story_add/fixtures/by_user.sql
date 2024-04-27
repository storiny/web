WITH inserted_users    AS (
	INSERT INTO users (id, name, username, email)
		VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
			   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
			   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com')
						  ),
	 inserted_story    AS (
		 INSERT INTO stories (id, user_id, slug, published_at)
			 VALUES (4, 1, 'some-story', NOW())
						  ),
	 inserted_follower AS (
		 INSERT INTO relations (follower_id, followed_id) VALUES (2, 1)
						  )
INSERT
INTO
	friends (transmitter_id, receiver_id, accepted_at)
VALUES (1, 3, NOW());
