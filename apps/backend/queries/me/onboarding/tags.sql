SELECT
	"t->story_tag->story".category::TEXT AS "category!",
	COALESCE(
					ARRAY_AGG(DISTINCT
					(t.id, t.name)
							 ) FILTER (
						WHERE t.id IS NOT NULL
						), '{}'
	)                                    AS "tags!: Vec<Tag>"
FROM
	tags t
		-- Join story tags
		INNER JOIN story_tags AS "t->story_tag"
		-- Join stories
		INNER JOIN stories AS "t->story_tag->story"
				   ON "t->story_tag->story".id = "t->story_tag".story_id
					   AND "t->story_tag->story".deleted_at IS NULL
					   AND "t->story_tag->story".published_at IS NOT NULL
				   ON "t->story_tag".tag_id = t.id
WHERE
	"t->story_tag->story".category = ANY ($1)
GROUP BY
	"t->story_tag->story".category,
	t.follower_count
ORDER BY
	t.follower_count DESC
LIMIT 25