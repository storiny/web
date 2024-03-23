WITH recommended_stories AS (SELECT
								 -- Story
								 s.id,
								 s.title,
								 s.slug                                  AS "slug!",
								 s.description,
								 s.splash_id,
								 s.splash_hex,
								 s.category::TEXT                        AS "category!",
								 s.age_restriction,
								 s.license,
								 s.user_id,
								 -- Stats
								 s.word_count,
								 s.read_count,
								 s.like_count,
								 s.comment_count,
								 -- Timestamps
								 s.published_at                          AS "published_at!",
								 s.edited_at,
								 -- Boolean flags
								 "s->is_bookmarked".story_id IS NOT NULL AS "is_bookmarked!",
								 "s->is_liked".story_id IS NOT NULL      AS "is_liked!",
								 -- User
								 JSON_BUILD_OBJECT('id', u.id, 'name', u.name, 'username', u.username, 'avatar_id',
												   u.avatar_id, 'avatar_hex', u.avatar_hex, 'public_flags',
												   u.public_flags)       AS "user!: Json<User>",
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
								 END                                     AS "blog: Json<Blog>",
								 -- Tags
								 COALESCE(ARRAY_AGG(DISTINCT ("s->story_tags->tag".id, "s->story_tags->tag".name))
										  FILTER (WHERE "s->story_tags->tag".id IS NOT NULL),
										  '{}')                          AS "tags!: Vec<Tag>",
								 -- Weights
								 COUNT(DISTINCT "s->source_tags")        AS "source_tags_weight",
								 s.published_at::DATE                    AS "published_at_date_only"
							 FROM
								 stories s
									 INNER JOIN users u
												ON u.id = s.user_id
													AND u.deleted_at IS NULL
													AND u.deactivated_at IS NULL
													-- Make sure to handle stories from private users
													AND (
													   NOT u.is_private OR
													   EXISTS (SELECT 1
															   FROM
																   friends
															   WHERE
																	 ((transmitter_id = u.id AND receiver_id = $4)
																		 OR
																	  (transmitter_id = $4 AND receiver_id = u.id))
																 AND accepted_at IS NOT NULL
															  )
													   )
													-- Filter out stories from blocked users
													AND NOT EXISTS (SELECT 1
																	FROM
																		blocks b
																	WHERE
																		  b.blocker_id = $4
																	  AND b.blocked_id = u.id
																   )
													-- Filter out stories from muted users
													AND NOT EXISTS (SELECT 1
																	FROM
																		mutes m
																	WHERE
																		  m.muter_id = $4
																	  AND m.muted_id = u.id
																   )
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
									 -- Boolean bookmark flag
									 LEFT OUTER JOIN bookmarks AS "s->is_bookmarked"
													 ON "s->is_bookmarked".story_id = s.id
														 AND "s->is_bookmarked".user_id = $4
														 AND "s->is_bookmarked".deleted_at IS NULL
									 -- Boolean story like flag
									 LEFT OUTER JOIN story_likes AS "s->is_liked"
													 ON "s->is_liked".story_id = s.id
														 AND "s->is_liked".user_id = $4
														 AND "s->is_liked".deleted_at IS NULL
									 --
									 -- Join source tags
									 LEFT OUTER JOIN story_tags AS "s->source_tags"
													 ON "s->source_tags".story_id = s.id
														 AND "s->source_tags".tag_id IN
															 (SELECT "source_s->story_tags".tag_id
															  FROM
																  stories source_s
																	  -- Join source story tags
																	  LEFT OUTER JOIN story_tags AS "source_s->story_tags"
																					  ON "source_s->story_tags".story_id = source_s.id
															  WHERE
																	source_s.id = $1
																AND source_s.published_at IS NOT NULL
																AND source_s.deleted_at IS NULL
															 )
							 WHERE
								   -- Ignore current story
								   s.id <> $1
								   -- Public
							   AND s.visibility = 2
							   AND s.published_at IS NOT NULL
							   AND s.deleted_at IS NULL
							 GROUP BY
								 s.id,
								 u.id,
								 s.published_at,
								 s.read_count,
								 "s->blog_stories->blog".id,
								 "s->is_liked".story_id,
								 "s->is_bookmarked".story_id
							 ORDER BY
								 source_tags_weight     DESC,
								 published_at_date_only DESC,
								 s.read_count           DESC
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
	"is_bookmarked!",
	"is_liked!",
	-- Joins
	"user!: Json<User>",
	"blog: Json<Blog>",
	"tags!: Vec<Tag>"
FROM
	recommended_stories;
