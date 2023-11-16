INSERT INTO
	users (id, name, username, email)
VALUES
	(2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com');

--         status: None,
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
	u.created_at
FROM
	users u
		LEFT OUTER JOIN user_statuses AS "u->status"
						ON u.id = "u->status".user_id
							AND ("u->status".expires_at IS NULL
								OR "u->status".expires_at > NOW())
WHERE
	  u.id = $1
  AND u.deactivated_at IS NULL
  AND u.deleted_at IS NULL