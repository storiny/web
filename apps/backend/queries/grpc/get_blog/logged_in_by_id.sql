SELECT b.id,
	   b.name,
	   b.slug,
	   b.description,
	   -- Logo
	   b.logo_id,
	   b.logo_hex,
	   -- Banner
	   b.banner_id,
	   b.banner_hex,
	   -- Newsletter
	   b.newsletter_splash_id,
	   b.newsletter_splash_hex,
	   -- Marks
	   b.mark_light,
	   b.mark_dark,
	   -- Fonts
	   b.font_primary,
	   b.font_secondary,
	   b.font_code,
	   --
	   b.domain,
	   b.category::TEXT                                  AS "category!",
	   b.user_id                                         AS "user_id!",
	   b.rsb_items_label,
	   b.has_plus_features,
	   b.is_external,
	   -- Theme
	   b.default_theme,
	   b.force_theme,
	   b.favicon,
	   b.hide_storiny_branding,
	   b.is_homepage_large_layout,
	   b.is_story_minimal_layout,
	   -- SEO
	   b.seo_description,
	   b.seo_title,
	   b.preview_image,
	   -- Connections
	   b.website_url,
	   b.public_email,
	   b.github_url,
	   b.instagram_url,
	   b.linkedin_url,
	   b.youtube_url,
	   b.twitter_url,
	   b.twitch_url,
	   -- Timestamps
	   b.created_at,
	   -- Boolean flags
	   "b->is_following".blog_id IS NOT NULL             AS "is_following!",
	   CASE WHEN b.user_id = $2 THEN TRUE ELSE FALSE END AS "is_owner!",
	   "b->is_editor".blog_id IS NOT NULL                AS "is_editor!",
	   "b->is_writer".blog_id IS NOT NULL                AS "is_writer!",
	   -- LSB items
	   COALESCE(
					   JSONB_AGG(
					   DISTINCT JSONB_BUILD_OBJECT(
							   'id', "b->lsb_items".id,
							   'name', "b->lsb_items".name,
							   'target', "b->lsb_items".target,
							   'icon', "b->lsb_items".icon,
							   'priority', "b->lsb_items".priority
								)
								) FILTER ( WHERE "b->lsb_items".id IS NOT NULL )
		   , '[]')                                       AS "lsb_items!: Json<Vec<LeftSidebarItem>>",
	   -- RSB items
	   COALESCE(
					   JSONB_AGG(
					   DISTINCT JSONB_BUILD_OBJECT(
							   'id', "b->rsb_items".id,
							   'primary_text', "b->rsb_items".primary_text,
							   'secondary_text', "b->rsb_items".secondary_text,
							   'target', "b->rsb_items".target,
							   'icon', "b->rsb_items".icon,
							   'priority', "b->rsb_items".priority
								)
								) FILTER ( WHERE "b->rsb_items".id IS NOT NULL )
		   , '[]')                                       AS "rsb_items!: Json<Vec<RightSidebarItem>>"
FROM
	blogs b
		-- Join left sidebar items
		LEFT OUTER JOIN blog_lsb_items AS "b->lsb_items"
						ON "b->lsb_items".blog_id = b.id
		-- Join right sidebar items
		LEFT OUTER JOIN blog_rsb_items AS "b->rsb_items"
						ON "b->rsb_items".blog_id = b.id
		-- Boolean following flag
		LEFT OUTER JOIN blog_followers AS "b->is_following"
						ON "b->is_following".blog_id = b.id
							AND "b->is_following".user_id = $2
							AND "b->is_following".deleted_at IS NULL
		-- Boolean editor flag
		LEFT OUTER JOIN blog_editors AS "b->is_editor"
						ON "b->is_editor".blog_id = b.id
							AND "b->is_editor".user_id = $2
							AND "b->is_editor".accepted_at IS NOT NULL
							AND "b->is_editor".deleted_at IS NULL
		-- Boolean writer flag
		LEFT OUTER JOIN blog_writers AS "b->is_writer"
						ON "b->is_writer".blog_id = b.id
							AND "b->is_writer".receiver_id = $2
							AND "b->is_writer".accepted_at IS NOT NULL
							AND "b->is_writer".deleted_at IS NULL
WHERE
	  b.id = $1
  AND b.deleted_at IS NULL
GROUP BY
	b.id,
	"b->is_following".blog_id,
	"b->is_editor".blog_id,
	"b->is_writer".blog_id