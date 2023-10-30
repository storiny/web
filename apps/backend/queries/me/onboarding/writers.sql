SELECT
	u.id           AS "id",
	u.name         AS "name",
	u.username     AS "username",
	u.avatar_id    AS "avatar_id",
	u.avatar_hex   AS "avatar_hex",
	u.public_flags AS "public_flags"
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