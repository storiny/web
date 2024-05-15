-- User

INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Sample user 1', 'sample_user_1', 'sample_1@example.com');

-- Asset

INSERT INTO
	assets (key, hex, height, width, user_id)
VALUES ('f4fd9bb4-f81b-454e-83f7-76cad3eba176', '000000', 0, 0, 2);

-- Blog

INSERT INTO
	blogs (id,
		   slug,
		   name,
		   domain,
		   description,
		   has_plus_features,
		   user_id,
		   newsletter_splash_id,
		   newsletter_splash_hex)
VALUES (3,
		'test-blog',
		'Test blog',
		'test.com',
		'Test description',
		TRUE,
		2,
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		'000000');
