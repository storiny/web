SELECT
	s.id,
	s.title,
	s.slug,
	s.description,
	s.splash_id,
	s.splash_hex,
	s.category::TEXT             AS "category!",
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
	"s->document".key            AS "doc_key",
	-- Boolean flags
	FALSE                        AS "is_bookmarked!",
	FALSE                        AS "is_liked!",
	-- User
	"s->user".name               AS user_name,
	"s->user".username           AS user_username,
	"s->user".rendered_bio       AS "user_rendered_bio!",
	"s->user".location           AS user_location,
	"s->user".avatar_id          AS user_avatar_id,
	"s->user".avatar_hex         AS user_avatar_hex,
	"s->user".public_flags       AS user_public_flags,
	"s->user".is_private         AS user_is_private,
	"s->user".created_at         AS user_created_at,
	"s->user".follower_count     AS user_follower_count,
	-- User boolean flags
	FALSE                        AS "user_is_following!",
	FALSE                        AS "user_is_follower!",
	FALSE                        AS "user_is_friend!",
	FALSE                        AS "user_is_blocked_by_user!",
	-- User status
	"s->user->status".emoji      AS "user_status_emoji?",
	"s->user->status".text       AS "user_status_text?",
	"s->user->status".expires_at AS "user_status_expires_at?",
	CASE
		WHEN "s->user->status".user_id IS NOT NULL AND (
			-- Global
			"s->user->status".visibility = 1
			)
			THEN TRUE
		ELSE FALSE
	END                          AS "user_has_status!",
	-- Tags
	COALESCE(
					ARRAY_AGG(
					("s->story_tags->tag".id, "s->story_tags->tag".name)
							 ) FILTER (
						WHERE "s->story_tags->tag".id IS NOT NULL
						), '{}'
	)                            AS "tags!: Vec<Tag>"
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
		-- Join tags
		LEFT OUTER JOIN (story_tags AS "s->story_tags"
		-- Join tags
		INNER JOIN tags AS "s->story_tags->tag"
						 ON "s->story_tags->tag".id = "s->story_tags".tag_id)
						ON "s->story_tags".story_id = s.id
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
	"s->user->status".user_id
LIMIT 1
