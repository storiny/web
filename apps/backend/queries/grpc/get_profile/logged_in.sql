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
		   WHEN (
			   -- Everyone
			   u.following_list_visibility = 1
				   -- Friends
				   OR (
				   u.following_list_visibility = 2
					   AND "u->is_friend".transmitter_id IS NOT NULL
				   )
				   -- Self
				   OR u.id = $2
			   )
			   THEN u.following_count
	   END                                                           AS "following_count",
	   -- Handle `friend_list_visibility`
	   CASE
		   WHEN (
			   -- Everyone
			   u.friend_list_visibility = 1
				   -- Friends
				   OR (
				   u.friend_list_visibility = 2
					   AND "u->is_friend".transmitter_id IS NOT NULL
				   )
				   -- Self
				   OR u.id = $2
			   )
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
		   WHEN "u->status".user_id IS NOT NULL AND (
			   -- Global
			   "u->status".visibility = 1
				   -- Followers
				   OR ("u->status".visibility = 2 AND "u->is_following".follower_id IS NOT NULL)
				   -- Friends
				   OR ("u->status".visibility = 3 AND "u->is_friend".transmitter_id IS NOT NULL)
				   -- Self
				   OR u.id = $2
			   )
			   THEN TRUE
		   ELSE FALSE
	   END                                                           AS "has_status!",
	   -- Boolean flags
	   "u->is_following".follower_id IS NOT NULL                     AS "is_following!",
	   "u->is_follower".follower_id IS NOT NULL                      AS "is_follower!",
	   "u->is_friend".transmitter_id IS NOT NULL                     AS "is_friend!",
	   "u->is_subscribed".follower_id IS NOT NULL                    AS "is_subscribed!",
	   "u->is_friend_request_sent".transmitter_id IS NOT NULL        AS "is_friend_request_sent!",
	   "u->is_blocked_by_user".blocker_id IS NOT NULL                AS "is_blocked_by_user!",
	   "u->is_blocked".blocker_id IS NOT NULL                        AS "is_blocked!",
	   "u->is_muted".muter_id IS NOT NULL                            AS "is_muted!"
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
		-- Boolean following flag
		LEFT OUTER JOIN relations AS "u->is_following"
						ON "u->is_following".followed_id = u.id
							AND "u->is_following".follower_id = $2
							AND "u->is_following".deleted_at IS NULL
		-- Boolean follower flag
		LEFT OUTER JOIN relations AS "u->is_follower"
						ON "u->is_follower".follower_id = u.id
							AND "u->is_follower".followed_id = $2
							AND "u->is_follower".deleted_at IS NULL
		-- Boolean friend flag
		LEFT OUTER JOIN friends AS "u->is_friend"
						ON (
							   ("u->is_friend".transmitter_id = u.id AND "u->is_friend".receiver_id = $2)
								   OR
							   ("u->is_friend".receiver_id = u.id AND "u->is_friend".transmitter_id = $2)
							   )
							AND "u->is_friend".accepted_at IS NOT NULL
							AND "u->is_friend".deleted_at IS NULL
		-- Boolean subscribed flag
		LEFT OUTER JOIN relations AS "u->is_subscribed"
						ON "u->is_subscribed".followed_id = u.id
							AND "u->is_subscribed".follower_id = $2
							AND "u->is_subscribed".subscribed_at IS NOT NULL
							AND "u->is_subscribed".deleted_at IS NULL
		-- Boolean friend request sent flag
		LEFT OUTER JOIN friends AS "u->is_friend_request_sent"
						ON ("u->is_friend_request_sent".receiver_id = u.id AND
							"u->is_friend_request_sent".transmitter_id = $2)
							AND "u->is_friend_request_sent".accepted_at IS NULL
							AND "u->is_friend_request_sent".deleted_at IS NULL
		-- Boolean blocked by user flag
		LEFT OUTER JOIN blocks AS "u->is_blocked_by_user"
						ON "u->is_blocked_by_user".blocker_id = u.id
							AND "u->is_blocked_by_user".blocked_id = $2
							AND "u->is_blocked_by_user".deleted_at IS NULL
		-- Boolean blocked flag
		LEFT OUTER JOIN blocks AS "u->is_blocked"
						ON "u->is_blocked".blocked_id = u.id
							AND "u->is_blocked".blocker_id = $2
							AND "u->is_blocked".deleted_at IS NULL
		-- Boolean muted flag
		LEFT OUTER JOIN mutes AS "u->is_muted"
						ON "u->is_muted".muted_id = u.id
							AND "u->is_muted".muter_id = $2
							AND "u->is_muted".deleted_at IS NULL
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
	"u->status".user_id,
	"u->is_following".follower_id,
	"u->is_follower".follower_id,
	"u->is_friend".transmitter_id,
	"u->is_subscribed".follower_id,
	"u->is_friend_request_sent".transmitter_id,
	"u->is_blocked_by_user".blocker_id,
	"u->is_blocked".blocker_id,
	"u->is_muted".muter_id
LIMIT 1
