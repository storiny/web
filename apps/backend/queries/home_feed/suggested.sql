WITH suggested_stories AS (SELECT
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
							   -- Boolean flags
							   "s->is_bookmarked".story_id IS NOT NULL                            AS "is_bookmarked!",
							   "s->is_liked".story_id IS NOT NULL                                 AS "is_liked!",
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
										FILTER (WHERE "s->story_tags->tag".id IS NOT NULL), '{}') AS "tags!: Vec<Tag>",
							   -- Weights
							   COUNT(DISTINCT "s->story_tags->follower")                          AS "followed_tags_weight",
							   COUNT(DISTINCT "s->blog_stories->follower")                        AS "followed_blogs_weight",
							   COUNT(DISTINCT "s->histories")                                     AS "histories_weight",
							   COUNT(DISTINCT "s->bookmarks")                                     AS "bookmarks_weight",
							   s.published_at::DATE                                               AS "published_at_date_only"
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
																   ((transmitter_id = u.id AND receiver_id = $1)
																	   OR (transmitter_id = $1 AND receiver_id = u.id))
															   AND accepted_at IS NOT NULL
															)
													 )
												  -- Filter out stories from blocked users
												  AND NOT EXISTS (SELECT 1
																  FROM
																	  blocks b
																  WHERE
																		b.blocker_id = $1
																	AND b.blocked_id = u.id
																 )
												  -- Filter out stories from muted users
												  AND NOT EXISTS (SELECT 1
																  FROM
																	  mutes m
																  WHERE
																		m.muter_id = $1
																	AND m.muted_id = u.id
																 )
								   -- Boolean bookmark flag
								   LEFT OUTER JOIN bookmarks AS "s->is_bookmarked"
												   ON "s->is_bookmarked".story_id = s.id
													   AND "s->is_bookmarked".user_id = $1
													   AND "s->is_bookmarked".deleted_at IS NULL
								   -- Boolean story like flag
								   LEFT OUTER JOIN story_likes AS "s->is_liked"
												   ON "s->is_liked".story_id = s.id
													   AND "s->is_liked".user_id = $1
													   AND "s->is_liked".deleted_at IS NULL
								   --
								   -- Join current user histories via category
								   LEFT OUTER JOIN histories AS "s->histories"
												   ON s.category != 'others'::story_category
													   AND s.category = (SELECT category
																		 FROM
																			 stories hs
																		 WHERE
																			   hs.id = "s->histories".story_id
																		   AND hs.deleted_at IS NULL
																		   AND hs.published_at IS NOT NULL
																		)
													   AND "s->histories".user_id = $1
													   AND "s->histories".deleted_at IS NULL
								   --
								   -- Join current user bookmarks via category
								   LEFT OUTER JOIN bookmarks AS "s->bookmarks"
												   ON s.category != 'others'::story_category
													   AND s.category = (SELECT category
																		 FROM
																			 stories bs
																		 WHERE
																			   bs.id = "s->bookmarks".story_id
																		   AND bs.deleted_at IS NULL
																		   AND bs.published_at IS NOT NULL
																		)
													   AND "s->bookmarks".user_id = $1
													   AND "s->bookmarks".deleted_at IS NULL
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
								   -- Join followed blogs for current user
								   LEFT OUTER JOIN blog_followers AS "s->blog_stories->follower"
												   ON "s->blog_stories->follower".blog_id = "s->blog_stories".blog_id
													   AND "s->blog_stories->follower".user_id = $1
													   AND "s->blog_stories->follower".deleted_at IS NULL
								   -- Join followed tags for current user
								   LEFT OUTER JOIN tag_followers AS "s->story_tags->follower"
												   ON "s->story_tags->follower".tag_id = "s->story_tags".tag_id
													   AND "s->story_tags->follower".user_id = $1
													   AND "s->story_tags->follower".deleted_at IS NULL
						   WHERE
								 -- Public
								 s.visibility = 2
							 AND s.deleted_at IS NULL
							 AND s.published_at IS NOT NULL
						   GROUP BY
							   s.id,
							   u.id,
							   s.published_at,
							   "s->blog_stories->blog".id,
							   "s->is_bookmarked".story_id,
							   "s->is_liked".story_id
						   ORDER BY
							   published_at_date_only DESC,
							   followed_blogs_weight  DESC,
							   followed_tags_weight   DESC,
							   histories_weight       DESC,
							   bookmarks_weight       DESC
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
	suggested_stories;

