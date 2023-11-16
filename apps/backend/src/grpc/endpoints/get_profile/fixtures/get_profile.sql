INSERT INTO
	users (id, name, username, email)
VALUES
	(2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');


--         connections: vec![],
--         is_following: false,
--         is_follower: false,
--         is_friend: false,
--         is_subscribed: false,
--         is_friend_request_sent: false,
--         is_blocked_by_user: false,
--         is_blocking: false,
--         is_muted: false,
--         is_self: false,

SELECT
	u.id,
	u.name,
	u.username,
	u.bio,
	u.rendered_bio,
	u.avatar_id,
	u.avatar_hex,
	u.banner_id,
	u.banner_hex,
	u.location,
	u.public_flags,
	-- Stats
	u.story_count,
	u.follower_count,
-- 	u.following_count,
-- 	u.friend_count,
	u.is_private,
	-- Timestamps
	u.created_at,
	-- Status
	-- Use a discrete column to deserialize it into `OffsetDateTime`.
	"u->status".expires_at AS "status_expires_at",
	"u->status".duration   AS "status_duration",
	"u->status".emoji      AS "status_emoji",
	"u->status".text       AS "status_text",
	"u->status".visibility AS "status_visibility",
	CASE
		WHEN "u->status".user_id IS NOT NULL
			THEN TRUE
		ELSE FALSE
	END                    AS "has_status",
	-- Boolean flags
	CASE
		WHEN COUNT("u->is_following") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_following",
	CASE
		WHEN COUNT("u->is_follower") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_follower",
	CASE
		WHEN COUNT("u->is_friend") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_friend",
	CASE
		WHEN COUNT("u->is_subscribed") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_subscribed",
	CASE
		WHEN COUNT("u->is_friend_request_sent") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_friend_request_sent",
	CASE
		WHEN COUNT("u->is_blocked_by_user") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_blocked_by_user",
	CASE
		WHEN COUNT("u->is_blocking") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_blocking",
	CASE
		WHEN COUNT("u->is_muted") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                    AS "is_muted"
FROM
	users u
		-- Join status
		LEFT OUTER JOIN user_statuses AS "u->status"
						ON u.id = "u->status".user_id
							AND ("u->status".expires_at IS NULL
								OR "u->status".expires_at > NOW())
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
								   ("u->is_friend".transmitter_id = u.id AND "u->is_friend".receiver_id = $4)
								   OR
								   ("u->is_friend".receiver_id = u.id AND "u->is_friend".transmitter_id = $4)
							   )
							AND "u->is_friend".accepted_at IS NOT NULL
							AND "u->is_friend".deleted_at IS NULL

WHERE
	  u.id = $1
  AND u.deactivated_at IS NULL
  AND u.deleted_at IS NULL
GROUP BY
	u.id
LIMIT 1