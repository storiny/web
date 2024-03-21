WITH liked_stories AS (WITH search_query AS (SELECT PLAINTO_TSQUERY('english', $1) AS tsq
											)
					   SELECT
						   -- Story
						   s.id,
						   s.title,
						   s.slug                                                   AS "slug!",
						   s.description,
						   s.splash_id,
						   s.splash_hex,
						   s.category::TEXT                                         AS "category!",
						   s.age_restriction,
						   s.license,
						   s.user_id,
						   -- Stats
						   s.word_count,
						   s.read_count,
						   s.like_count,
						   s.comment_count,
						   -- Timestamps
						   s.published_at                                           AS "published_at!",
						   s.edited_at,
						   -- Boolean flags
						   "s->is_bookmarked".story_id IS NOT NULL                  AS "is_bookmarked!",
						   -- User
						   JSON_BUILD_OBJECT(
								   'id', su.id,
								   'name', su.name,
								   'username', su.username,
								   'avatar_id', su.avatar_id,
								   'avatar_hex', su.avatar_hex,
								   'public_flags', su.public_flags
						   )                                                        AS "user!: Json<User>",
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
						   END                                                      AS "blog: Json<Blog>",
						   -- Tags
						   COALESCE(
										   ARRAY_AGG(
										   DISTINCT ("s->story_tags->tag".id, "s->story_tags->tag".name)
													) FILTER (
											   WHERE "s->story_tags->tag".id IS NOT NULL
											   ), '{}'
						   )                                                        AS "tags!: Vec<Tag>",
						   -- Query score
						   TS_RANK_CD(s.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
					   FROM
						   story_likes sl
							   -- Join story
							   INNER JOIN stories s
										  ON s.id = sl.story_id
							   -- Join story user
							   INNER JOIN users su
										  ON su.id = s.user_id
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
							   -- Boolean bookmark flag
							   LEFT OUTER JOIN bookmarks AS "s->is_bookmarked"
											   ON "s->is_bookmarked".story_id = s.id
												   AND "s->is_bookmarked".user_id = $2
												   AND "s->is_bookmarked".deleted_at IS NULL
					   WHERE
							 sl.user_id = $2
						 AND s.search_vec @@ (SELECT tsq FROM search_query)
						 AND sl.deleted_at IS NULL
					   GROUP BY
						   s.id,
						   su.id,
						   sl.created_at,
						   "s->blog_stories->blog".id,
						   "s->is_bookmarked".story_id
					   ORDER BY
						   query_score   DESC,
						   sl.created_at DESC
					   LIMIT $3 OFFSET $4
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
	"is_bookmarked!",
	TRUE AS "is_liked!",
	-- Joins
	"user!: Json<User>",
	"blog: Json<Blog>",
	"tags!: Vec<Tag>"
FROM
	liked_stories
