SELECT u.id,
	   u.name,
	   u.username,
	   u.bio,
	   u.rendered_bio                                                AS "rendered_bio!",
	   u.avatar_id,
	   u.avatar_hex,
	   u.banner_id,
	   u.banner_hex,
	   u.location,
	   u.public_flags,
	   u.is_private,
	   -- Stats
	   u.story_count,
	   u.follower_count,
	   u.is_plus_member,
	   -- Handle `following_list_visibility`
	   CASE
		   -- Everyone
		   WHEN (u.following_list_visibility = 1)
			   THEN u.following_count
	   END                                                           AS "following_count",
	   -- Handle `friend_list_visibility`
	   CASE
		   -- Everyone
		   WHEN (u.friend_list_visibility = 1)
			   THEN u.friend_count
	   END                                                           AS "friend_count",
	   -- Timestamps
	   u.created_at,
	   -- Connections
	   COALESCE(ARRAY_AGG(DISTINCT
				("u->connection".provider, "u->connection".provider_identifier, "u->connection".display_name))
				FILTER (WHERE "u->connection".id IS NOT NULL), '{}') AS "connections!: Vec<ProfileConnection>",
	   -- Status
	   -- Use a discrete column to deserialize it into `OffsetDateTime`.
	   "u->status".expires_at                                        AS "status_expires_at?",
	   "u->status".duration                                          AS "status_duration?",
	   "u->status".emoji                                             AS "status_emoji?",
	   "u->status".text                                              AS "status_text?",
	   "u->status".visibility                                        AS "status_visibility?",
	   CASE
		   WHEN "u->status".user_id IS NOT NULL AND
			   -- Global
				"u->status".visibility = 1
			   THEN TRUE
		   ELSE FALSE
	   END                                                           AS "has_status!",
	   -- Boolean flags
	   FALSE                                                         AS "is_following!",
	   FALSE                                                         AS "is_follower!",
	   FALSE                                                         AS "is_friend!",
	   FALSE                                                         AS "is_subscribed!",
	   FALSE                                                         AS "is_friend_request_sent!",
	   FALSE                                                         AS "is_blocked_by_user!",
	   FALSE                                                         AS "is_blocked!",
	   FALSE                                                         AS "is_muted!"
FROM
	users u
		-- Join status
		LEFT OUTER JOIN user_statuses AS "u->status"
						ON u.id = "u->status".user_id
							AND ("u->status".expires_at IS NULL
								OR "u->status".expires_at > NOW())
		-- Join connections
		LEFT OUTER JOIN connections AS "u->connection"
						ON "u->connection".user_id = u.id
							AND "u->connection".hidden IS FALSE
WHERE
	  u.username = $1
  AND u.deactivated_at IS NULL
  AND u.deleted_at IS NULL
GROUP BY
	u.id,
	"u->status".expires_at,
	"u->status".duration,
	"u->status".emoji,
	"u->status".text,
	"u->status".visibility,
	"u->status".user_id
LIMIT 1
