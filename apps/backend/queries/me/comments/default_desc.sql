SELECT
	-- Comment
	c.id,
	c.user_id,
	c.story_id,
	c.hidden,
	c.rendered_content as "rendered_content!",
	CASE WHEN c.user_id = $1 THEN c.content END AS "content?",
	c.like_count,
	c.reply_count,
	c.created_at,
	c.edited_at,
	-- Story
	JSON_BUILD_OBJECT(
			'id', cs.id,
			'slug', cs.slug,
			'title', cs.title,
			'user_id', cs.user_id,
			'splash_id', cs.splash_id,
			'splash_hex', cs.splash_hex,
			'user', JSON_BUILD_OBJECT('id', "cs->user".id, 'username', "cs->user".username)
	)                                                 AS "story!: Json<Story>",
	-- Boolean flags
	CASE
		WHEN COUNT("c->is_liked") = 1
			THEN
			TRUE
		ELSE
			FALSE
	END                                               AS "is_liked!"
FROM
	comments c
		-- Join story
		INNER JOIN stories AS cs
		-- Join story user
		INNER JOIN users AS "cs->user"
				   ON "cs->user".id = cs.user_id
		--
				   ON cs.id = c.story_id
		--
		-- Boolean like flag
		LEFT OUTER JOIN comment_likes AS "c->is_liked"
						ON "c->is_liked".comment_id = c.id
							AND "c->is_liked".user_id = $1
							AND "c->is_liked".deleted_at IS NULL
WHERE
	  c.user_id = $1
  AND c.deleted_at IS NULL
GROUP BY
	c.id,
	cs.id,
	"cs->user".id,
	c.created_at
ORDER BY
	c.created_at DESC
LIMIT $2 OFFSET $3