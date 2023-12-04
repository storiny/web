WITH tag_stories AS (SELECT
						 -- Story
						 s.id,
						 s.title,
						 s.slug                                                             AS "slug!",
						 s.description,
						 s.splash_id,
						 s.splash_hex,
						 s.category::TEXT                                                   AS "category!",
						 s.age_restriction,
						 s.license,
						 s.user_id,
						 -- Stats
						 s.word_count,
						 s.read_count,
						 s.like_count,
						 s.comment_count,
						 -- Timestamps
						 s.published_at                                                     AS "published_at!",
						 s.edited_at,
						 -- User
						 JSON_BUILD_OBJECT('id', u.id, 'name', u.name, 'username', u.username, 'avatar_id',
										   u.avatar_id, 'avatar_hex', u.avatar_hex, 'public_flags',
										   u.public_flags)                                  AS "user!: Json<User>",
						 -- Tags
						 COALESCE(ARRAY_AGG(DISTINCT ("s->story_tags->tag".id, "s->story_tags->tag".name))
								  FILTER (WHERE "s->story_tags->tag".id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
					 FROM
						 stories s
							 INNER JOIN users u
										ON u.id = s.user_id
											AND u.deleted_at IS NULL
											AND u.deactivated_at IS NULL
											-- Skip stories from private users
											AND u.is_private IS FALSE
							 --
							 -- Join story tags
							 INNER JOIN (story_tags AS "s->story_tags"
							 -- Join tags
							 INNER JOIN tags AS "s->story_tags->tag"
										 ON "s->story_tags->tag".id = "s->story_tags".tag_id
											 AND "s->story_tags->tag".name = $1)
										ON "s->story_tags".story_id = s.id
					 WHERE
						   -- Public
						   s.visibility = 2
					   AND s.published_at IS NOT NULL
					   AND s.deleted_at IS NULL
					 GROUP BY
						 s.id,
						 u.id,
						 s.published_at
					 ORDER BY s.published_at DESC
					 LIMIT $2 OFFSET $3
					)
SELECT
	-- Story
	id,
	title,
	"slug!",
	description,
	splash_id,
	splash_hex,
	"category!",
	age_restriction,
	license,
	user_id,
	-- Stats
	word_count,
	read_count,
	like_count,
	comment_count,
	-- Timestamps
	"published_at!",
	edited_at,
	-- Boolean flags
	FALSE AS "is_bookmarked!",
	FALSE AS "is_liked!",
	-- Joins
	"user!: Json<User>",
	"tags!: Vec<Tag>"
FROM
	tag_stories;
