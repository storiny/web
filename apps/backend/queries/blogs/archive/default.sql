WITH blog_stories AS (SELECT
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
						  bs.accepted_at                                                     AS "published_at!",
						  s.edited_at,
						  -- User
						  JSON_BUILD_OBJECT('id', u.id, 'name', u.name, 'username', u.username, 'avatar_id',
											u.avatar_id, 'avatar_hex', u.avatar_hex, 'public_flags',
											u.public_flags)                                  AS "user!: Json<User>",
						  -- Tags
						  COALESCE(ARRAY_AGG(DISTINCT ("s->story_tags->tag".id, "s->story_tags->tag".name))
								   FILTER (WHERE "s->story_tags->tag".id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
					  FROM
						  blog_stories AS bs
							  INNER JOIN stories AS s
										 ON s.id = bs.story_id
											 AND CASE
													 WHEN $4::SMALLINT IS NOT NULL
														 THEN DATE_PART('year', bs.accepted_at) = $4::SMALLINT
													 ELSE TRUE
												 END
											 AND CASE
													 WHEN $5::SMALLINT IS NOT NULL
														 THEN DATE_PART('month', bs.accepted_at) = $5::SMALLINT
													 ELSE TRUE
												 END
							  INNER JOIN users AS u
										 ON u.id = s.user_id
											 AND u.deleted_at IS NULL
											 AND u.deactivated_at IS NULL
											 -- Skip stories from private users
											 AND u.is_private IS FALSE
							  --
							  -- Join story tags
							  LEFT OUTER JOIN (story_tags AS "s->story_tags"
							  -- Join tags
							  INNER JOIN tags AS "s->story_tags->tag"
											   ON "s->story_tags->tag".id = "s->story_tags".tag_id)
											  ON "s->story_tags".story_id = s.id
					  WHERE
							bs.blog_id = $1
						AND bs.accepted_at IS NOT NULL
						AND bs.deleted_at IS NULL
					  GROUP BY
						  s.id,
						  u.id,
						  bs.accepted_at
					  ORDER BY bs.accepted_at DESC
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
	blog_stories;
