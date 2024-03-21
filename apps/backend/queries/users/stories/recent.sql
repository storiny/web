WITH user_stories AS (SELECT
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
						  END                                                                AS "blog: Json<Blog>",
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
							  -- Join blog stories
							  LEFT OUTER JOIN (blog_stories AS "s->blog_stories"
							  -- Join blogs
							  INNER JOIN blogs AS "s->blog_stories->blog"
											   ON "s->blog_stories->blog".id = "s->blog_stories".blog_id
							  )
											  ON "s->blog_stories".story_id = s.id
												  AND "s->blog_stories".accepted_at IS NOT NULL
												  AND "s->blog_stories".deleted_at IS NULL
							  -- Join story tags
							  LEFT OUTER JOIN (story_tags AS "s->story_tags"
							  -- Join tags
							  INNER JOIN tags AS "s->story_tags->tag"
											   ON "s->story_tags->tag".id = "s->story_tags".tag_id)
											  ON "s->story_tags".story_id = s.id
					  WHERE
							-- Public
							s.visibility = 2
						AND s.user_id = $1
						AND s.published_at IS NOT NULL
						AND s.deleted_at IS NULL
					  GROUP BY
						  s.id,
						  u.id,
						  s.published_at,
						  "s->blog_stories->blog".id
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
	"blog: Json<Blog>",
	"tags!: Vec<Tag>"
FROM
	user_stories;
