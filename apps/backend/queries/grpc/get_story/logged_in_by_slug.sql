WITH incremented_view_count AS (
	UPDATE stories
		SET view_count = view_count + 1
		WHERE
			slug = $1
				AND published_at IS NOT NULL
				AND deleted_at IS NULL
							   )
SELECT s.id,
	   s.title,
	   s.slug,
	   s.description,
	   s.splash_id,
	   s.splash_hex,
	   s.category::TEXT                                     AS "category!",
	   s.age_restriction,
	   s.visibility,
	   s.license,
	   s.user_id,
	   s.disable_comments,
	   s.disable_public_revision_history,
	   s.disable_toc,
	   s.canonical_url,
	   s.seo_description,
	   s.seo_title,
	   s.preview_image,
	   -- Stats
	   s.like_count,
	   s.read_count,
	   s.word_count,
	   s.comment_count,
	   -- Timestamps
	   s.created_at,
	   s.edited_at,
	   s.deleted_at,
	   s.published_at,
	   s.first_published_at,
	   -- Joins
	   "s->document".key                                    AS "doc_key",
	   -- Boolean flags
	   "s->is_bookmarked".story_id IS NOT NULL              AS "is_bookmarked!",
	   "s->is_liked".story_id IS NOT NULL                   AS "is_liked!",
	   -- User
	   "s->user".name                                       AS user_name,
	   "s->user".username                                   AS user_username,
	   "s->user".rendered_bio                               AS "user_rendered_bio!",
	   "s->user".location                                   AS user_location,
	   "s->user".avatar_id                                  AS user_avatar_id,
	   "s->user".avatar_hex                                 AS user_avatar_hex,
	   "s->user".public_flags                               AS user_public_flags,
	   "s->user".is_private                                 AS user_is_private,
	   "s->user".created_at                                 AS user_created_at,
	   "s->user".follower_count                             AS user_follower_count,
	   -- User boolean flags
	   "s->user->is_following".follower_id IS NOT NULL      AS "user_is_following!",
	   "s->user->is_follower".follower_id IS NOT NULL       AS "user_is_follower!",
	   "s->user->is_friend".transmitter_id IS NOT NULL      AS "user_is_friend!",
	   "s->user->is_blocked_by_user".blocker_id IS NOT NULL AS "user_is_blocked_by_user!",
	   -- User status
	   "s->user->status".emoji                              AS "user_status_emoji?",
	   "s->user->status".text                               AS "user_status_text?",
	   "s->user->status".expires_at                         AS "user_status_expires_at?",
	   CASE
		   WHEN "s->user->status".user_id IS NOT NULL AND (
			   -- Global
			   "s->user->status".visibility = 1
				   -- Followers
				   OR ("s->user->status".visibility = 2 AND "s->user->is_following".follower_id IS NOT NULL)
				   -- Friends
				   OR ("s->user->status".visibility = 3 AND "s->user->is_friend".transmitter_id IS NOT NULL)
			   )
			   THEN TRUE
		   ELSE FALSE
	   END                                                  AS "user_has_status!",
	   -- Tags
	   COALESCE(
					   ARRAY_AGG(
					   DISTINCT ("s->story_tags->tag".id, "s->story_tags->tag".name)
								) FILTER (
						   WHERE "s->story_tags->tag".id IS NOT NULL
						   ), '{}'
	   )                                                    AS "tags!: Vec<Tag>",
	   -- Contributors
	   COALESCE(
					   JSONB_AGG(
					   DISTINCT JSONB_BUILD_OBJECT(
							   'id', "s->contributors->user".id,
							   'name', "s->contributors->user".name,
							   'username', "s->contributors->user".username,
							   'avatar_id', "s->contributors->user".avatar_id,
							   'avatar_hex', "s->contributors->user".avatar_hex,
							   'public_flags', "s->contributors->user".public_flags
								)
								) FILTER ( WHERE "s->contributors->user".id IS NOT NULL )
		   , '[]')                                          AS "contributors!: Json<Vec<User>>",
	   -- Blog
	   CASE
		   WHEN "s->blog_stories->blog".id IS NOT NULL
			   THEN
			   JSON_BUILD_OBJECT(
					   'id', "s->blog_stories->blog".id,
					   'name', "s->blog_stories->blog".name,
					   'slug', "s->blog_stories->blog".slug,
					   'domain', "s->blog_stories->blog".domain,
					   'logo_id', "s->blog_stories->blog".logo_id,
					   'logo_hex', "s->blog_stories->blog".logo_hex
			   )
	   END                                                  AS "blog: Json<Blog>"
FROM
	stories s
		-- Join document
		INNER JOIN documents AS "s->document"
				   ON s.id = "s->document".story_id
					   AND "s->document".is_editable IS FALSE
		-- Join user
		INNER JOIN users "s->user"
				   ON "s->user".id = s.user_id
		-- Join user status
		LEFT OUTER JOIN user_statuses AS "s->user->status"
						ON "s->user".id = "s->user->status".user_id
							AND ("s->user->status".expires_at IS NULL
								OR "s->user->status".expires_at > NOW())
		-- Join contributors
		LEFT OUTER JOIN (story_contributors AS "s->contributors"
		INNER JOIN users AS "s->contributors->user"
						 ON "s->contributors->user".id = "s->contributors".user_id
		)
						ON "s->contributors".story_id = s.id
							AND "s->contributors".role = 'editor'
							AND "s->contributors".accepted_at IS NOT NULL
							AND "s->contributors".deleted_at IS NULL
		-- Join story tags
		LEFT OUTER JOIN (story_tags AS "s->story_tags"
		INNER JOIN tags AS "s->story_tags->tag"
						 ON "s->story_tags->tag".id = "s->story_tags".tag_id
		)
						ON "s->story_tags".story_id = s.id
		-- Join blog story
		LEFT OUTER JOIN (blog_stories AS "s->blog_stories"
		INNER JOIN blogs AS "s->blog_stories->blog"
						 ON "s->blog_stories->blog".id = "s->blog_stories".blog_id
							 AND "s->blog_stories->blog".deleted_at IS NULL
		)
						ON "s->blog_stories".story_id = s.id
							AND "s->blog_stories".deleted_at IS NULL
							AND "s->blog_stories".accepted_at IS NOT NULL
		-- Boolean bookmark flag
		LEFT OUTER JOIN bookmarks AS "s->is_bookmarked"
						ON "s->is_bookmarked".story_id = s.id
							AND "s->is_bookmarked".user_id = $2
							AND "s->is_bookmarked".deleted_at IS NULL
		-- Boolean story like flag
		LEFT OUTER JOIN story_likes AS "s->is_liked"
						ON "s->is_liked".story_id = s.id
							AND "s->is_liked".user_id = $2
							AND "s->is_liked".deleted_at IS NULL
		-- Boolean user following flag
		LEFT OUTER JOIN relations AS "s->user->is_following"
						ON "s->user->is_following".followed_id = "s->user".id
							AND "s->user->is_following".follower_id = $2
							AND "s->user->is_following".deleted_at IS NULL
		-- Boolean user follower flag
		LEFT OUTER JOIN relations AS "s->user->is_follower"
						ON "s->user->is_follower".follower_id = "s->user".id
							AND "s->user->is_follower".followed_id = $2
							AND "s->user->is_follower".deleted_at IS NULL
		-- Boolean user friend flag
		LEFT OUTER JOIN friends AS "s->user->is_friend"
						ON (
							   ("s->user->is_friend".transmitter_id = "s->user".id AND
								"s->user->is_friend".receiver_id = $2)
								   OR
							   ("s->user->is_friend".receiver_id = "s->user".id AND
								"s->user->is_friend".transmitter_id = $2)
							   )
							AND "s->user->is_friend".accepted_at IS NOT NULL
							AND "s->user->is_friend".deleted_at IS NULL
		-- Booolean user blocked by user flag
		LEFT OUTER JOIN blocks AS "s->user->is_blocked_by_user"
						ON "s->user->is_blocked_by_user".blocker_id = "s->user".id
							AND "s->user->is_blocked_by_user".blocked_id = $2
							AND "s->user->is_blocked_by_user".deleted_at IS NULL
WHERE
	s.slug = $1
GROUP BY
	s.id,
	doc_key,
	user_name,
	user_username,
	"user_rendered_bio!",
	user_location,
	user_avatar_id,
	user_avatar_hex,
	user_public_flags,
	user_is_private,
	user_created_at,
	user_follower_count,
	"user_status_emoji?",
	"user_status_text?",
	"user_status_expires_at?",
	"s->user->status".user_id,
	"s->user->is_following".follower_id,
	"s->user->is_follower".follower_id,
	"s->user->is_friend".transmitter_id,
	"s->user->is_blocked_by_user".blocker_id,
	"s->is_liked".story_id,
	"s->is_bookmarked".story_id,
	"s->blog_stories->blog".id
LIMIT 1
