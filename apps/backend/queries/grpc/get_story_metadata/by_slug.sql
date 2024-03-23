SELECT s.id,
	   s.title,
	   s.slug,
	   s.description,
	   s.splash_id,
	   s.splash_hex,
	   s.category::TEXT       AS "category!",
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
	   -- Timestamps
	   s.created_at,
	   s.edited_at,
	   s.deleted_at,
	   s.published_at,
	   s.first_published_at,
	   -- Joins
	   "s->document".key      AS "doc_key",
	   CASE
		   WHEN (
			   "s->blog_stories->blog->editor".id IS NOT NULL
				   OR "s->blog_stories->blog".user_id = $2
			   )
			   THEN 'blog-member'
		   WHEN "s->contributor".id IS NOT NULL
			   THEN "s->contributor".role
		   ELSE 'editor'
	   END                    AS "role!",
	   -- User
	   "s->user".name         AS user_name,
	   "s->user".username     AS user_username,
	   "s->user".avatar_id    AS user_avatar_id,
	   "s->user".avatar_hex   AS user_avatar_hex,
	   "s->user".public_flags AS user_public_flags,
	   -- Tags
	   (
		   -- Draft tags
		   COALESCE(
						   ARRAY_AGG(
						   DISTINCT ("s->draft_tags".name, "s->draft_tags".name)
									) FILTER (
							   WHERE "s->draft_tags".name IS NOT NULL
							   ), '{}'
		   ) ||
			   -- Story tags
		   COALESCE(
						   ARRAY_AGG(
					   -- We need to cast the BIGINT id to string
						   DISTINCT ("s->story_tags->tag".id::TEXT, "s->story_tags->tag".name)
									) FILTER (
							   WHERE "s->story_tags->tag".id IS NOT NULL
							   ), '{}'
		   ))                 AS "tags!: Vec<Tag>",
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
	   END                    AS "blog: Json<Blog>"
FROM
	stories s
		-- Join document
		INNER JOIN documents AS "s->document"
				   ON s.id = "s->document".story_id
					   AND "s->document".is_editable IS FALSE
		-- Join user
		INNER JOIN users "s->user"
				   ON "s->user".id = s.user_id
		-- Join blog stories
		LEFT OUTER JOIN (blog_stories AS "s->blog_stories"
		-- Join blogs
		INNER JOIN blogs AS "s->blog_stories->blog"
						 ON "s->blog_stories->blog".id = "s->blog_stories".blog_id
							 AND "s->blog_stories->blog".deleted_at IS NULL
		)
						ON "s->blog_stories".story_id = s.id
							AND "s->blog_stories".deleted_at IS NULL
		-- Join blog editor
		LEFT OUTER JOIN blog_editors AS "s->blog_stories->blog->editor"
						ON "s->blog_stories->blog->editor".user_id = $2
							AND "s->blog_stories->blog->editor".blog_id = "s->blog_stories->blog".id
							AND "s->blog_stories->blog->editor".accepted_at IS NOT NULL
							AND "s->blog_stories->blog->editor".deleted_at IS NULL
		-- Join contributor
		LEFT OUTER JOIN story_contributors "s->contributor"
						ON "s->contributor".story_id = s.id
							AND "s->contributor".user_id = $2
							AND "s->contributor".accepted_at IS NOT NULL
							AND "s->contributor".deleted_at IS NULL
		-- Join draft tags
		LEFT OUTER JOIN draft_tags AS "s->draft_tags"
						ON "s->draft_tags".story_id = s.id
		--
		-- Join story tags
		LEFT OUTER JOIN (story_tags AS "s->story_tags"
		INNER JOIN tags AS "s->story_tags->tag"
						 ON "s->story_tags->tag".id = "s->story_tags".tag_id
		)
						ON "s->story_tags".story_id = s.id
WHERE
	  s.slug = $1
  AND (
		  s.user_id = $2
			  OR "s->contributor".id IS NOT NULL
			  OR "s->blog_stories->blog->editor".id IS NOT NULL
			  OR "s->blog_stories->blog".user_id = $2
		  )
GROUP BY
	s.id,
	"s->contributor".id,
	"s->blog_stories->blog->editor".id,
	"s->blog_stories->blog".user_id,
	"s->blog_stories->blog".id,
	doc_key,
	user_name,
	user_username,
	user_avatar_id,
	user_avatar_hex,
	user_public_flags
LIMIT 1
