SELECT
	s.id,
	s.slug,
	s.published_at,
	s.edited_at,
	s.read_count,
	"s->user".username AS "user_username"
FROM
	stories s
		INNER JOIN users AS "s->user"
				   ON s.user_id = "s->user".id
					   -- Ignore stories from private users
					   AND "s->user".is_private IS FALSE
WHERE
	  s.published_at IS NOT NULL
	  -- Public
  AND s.visibility = 2
  AND s.deleted_at IS NULL
ORDER BY
	s.read_count DESC
LIMIT 50000 OFFSET 0;