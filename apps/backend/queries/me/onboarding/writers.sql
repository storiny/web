SELECT u.id,
	   u.name,
	   u.username,
	   u.avatar_id,
	   u.avatar_hex,
	   u.public_flags,
	   u.rendered_bio AS "rendered_bio!"
FROM
	users u
		-- Join stories
		INNER JOIN stories AS "u->story"
				   ON "u->story".user_id = u.id
					   AND "u->story".deleted_at IS NULL
					   AND "u->story".published_at IS NOT NULL
WHERE
	"u->story".category::TEXT = ANY ($1)
ORDER BY
	u.follower_count DESC
LIMIT 25