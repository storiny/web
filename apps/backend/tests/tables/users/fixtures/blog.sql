WITH inserted_user AS (
	INSERT INTO
		users (name, username, email)
		VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
		RETURNING id
					  )
INSERT
INTO
	blogs (id, name, slug, user_id)
VALUES (1, 'Sample blog', 'sample-blog', (SELECT id FROM inserted_user));
