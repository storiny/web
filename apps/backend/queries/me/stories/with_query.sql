WITH stories_result AS (WITH search_query AS (SELECT PLAINTO_TSQUERY('english', $1) AS tsq
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
							"s->is_liked".story_id IS NOT NULL                       AS "is_liked!",
							"s->is_bookmarked".story_id IS NOT NULL                  AS "is_bookmarked!",
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
							stories s
								-- Join story tags
								LEFT OUTER JOIN (story_tags AS "s->story_tags"
								-- Join tags
								INNER JOIN tags AS "s->story_tags->tag"
												 ON "s->story_tags->tag".id = "s->story_tags".tag_id)
												ON "s->story_tags".story_id = s.id
								-- Boolean story like flag
								LEFT OUTER JOIN story_likes AS "s->is_liked"
												ON "s->is_liked".story_id = s.id
													AND "s->is_liked".user_id = $2
													AND "s->is_liked".deleted_at IS NULL
								-- Boolean bookmark flag
								LEFT OUTER JOIN bookmarks AS "s->is_bookmarked"
												ON "s->is_bookmarked".story_id = s.id
													AND "s->is_bookmarked".user_id = $2
													AND "s->is_bookmarked".deleted_at IS NULL
						WHERE
							  s.user_id = $2
						  AND s.search_vec @@ (SELECT tsq FROM search_query)
						  AND s.published_at IS NOT NULL
						  AND s.deleted_at IS NULL
						GROUP BY
							s.id,
							s.published_at,
							"s->is_liked".story_id,
							"s->is_bookmarked".story_id
						ORDER BY
							query_score    DESC,
							s.published_at DESC
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
	"is_liked!",
	-- Joins
	"tags!: Vec<Tag>"
FROM
	stories_result
