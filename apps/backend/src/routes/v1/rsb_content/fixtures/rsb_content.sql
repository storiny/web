WITH inserted_users AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com'),
														 (2, 'New user', 'someone', 'someone@example.com')
					   ),
	 inserted_tags  AS (
		 INSERT INTO tags (name) VALUES ('tag-1'), ('tag-2'), ('tag-3')
					   )
INSERT
INTO
	stories (id, title, slug, user_id, published_at, first_published_at)
VALUES (2, 'one', 'sample-story-1', 1, NOW(), NOW()),
	   (3, 'two', 'sample-story-2', 2, NOW(), NOW()),
	   (4, 'three', 'sample-story-3', 2, NOW(), NOW());
