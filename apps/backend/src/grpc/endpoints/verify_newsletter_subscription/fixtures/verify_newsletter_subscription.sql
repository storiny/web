WITH inserted_user AS (
	INSERT INTO users (id, name, username, email) VALUES (1, 'One', 'one', 'one@example.com')
					  )
INSERT
INTO
	blogs (id, name, slug, user_id)
VALUES (2, 'Sample blog', 'sample-blog', 1)
