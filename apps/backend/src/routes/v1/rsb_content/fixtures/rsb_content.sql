SELECT
	-- Story
	s.id,
	s.title,
	s.slug,
	s.read_count,
	-- User
	JSON_BUILD_OBJECT(
			'id', u.id,
			'name', u.name,
			'username', u.username,
			'avatar_id', u.avatar_id,
			'avatar_hex', u.avatar_hex,
			'public_flags', u.public_flags
	) AS "user"
FROM
	stories s
		INNER JOIN users u
				   ON u.id = s.user_id
					   -- Ignore stories from private users
					   AND u.is_private IS FALSE
WHERE
	  -- Public
	  s.visibility = 2
  AND s.published_at IS NOT NULL
  AND s.deleted_at IS NULL
LIMIT 3;