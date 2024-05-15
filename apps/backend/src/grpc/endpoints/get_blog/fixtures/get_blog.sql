-- Users

INSERT INTO
	users (id, name, username, email)
VALUES (2, 'Sample user 1', 'sample_user_1', 'sample_1@example.com'),
	   (3, 'Sample user 2', 'sample_user_2', 'sample_2@example.com'),
	   (4, 'Sample user 3', 'sample_user_3', 'sample_3@example.com');

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
	-- Banner
		   banner_id,
		   banner_hex,
	-- Newsletter splash
		   newsletter_splash_id,
		   newsletter_splash_hex,
	-- Fonts
		   font_primary,
		   font_secondary,
		   font_code,
	-- Other
		   hide_storiny_branding,
		   is_external)
VALUES (5,
		'test-blog',
		'Test blog',
		'test.com',
		'Test description',
		TRUE,
		2,
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		'000000',
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		'000000',
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		'f4fd9bb4-f81b-454e-83f7-76cad3eba176',
		TRUE,
		TRUE);

-- Editor

INSERT INTO
	blog_editors (user_id, blog_id)
VALUES (3, 5);

UPDATE blog_editors
SET
	accepted_at = NOW()
WHERE
	user_id = 3;

-- Writer

INSERT INTO
	blog_writers (transmitter_id, receiver_id, blog_id)
VALUES (2, 4, 5);

UPDATE blog_writers
SET
	accepted_at = NOW()
WHERE
	receiver_id = 4;

-- LSB item

INSERT INTO
	blog_lsb_items (name, target, priority, blog_id)
VALUES ('About', 'https://storiny.com/about', 2, 5);

-- RSB item

INSERT INTO
	blog_rsb_items (primary_text, secondary_text, target, priority, blog_id)
VALUES ('Item 1', 'item-1', 'https://storiny.com/item-1', 1, 5),
	   ('Item 2', 'item-2', 'https://storiny.com/item-2', 2, 5);
