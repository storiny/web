WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'Sample user', 'sample_user', 'sample@example.com')
		RETURNING id
					  )
INSERT
INTO
	stories (id, title, slug, category, user_id, published_at, first_published_at)
VALUES (2, 'one', 'sample-story-1', 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW()),
	   (3, 'two', 'sample-story-2', 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW()),
	   (4, 'three', 'sample-story-3', 'diy'::story_category, (SELECT id FROM inserted_user), NOW(), NOW());