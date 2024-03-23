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
	   b.category::TEXT AS "category!",
	   b.user_id        AS "user_id!",
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
	   FALSE            AS "is_following!",
	   FALSE            AS "is_owner!",
	   FALSE            AS "is_editor!",
	   FALSE            AS "is_writer!",
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
		   , '[]')      AS "lsb_items!: Json<Vec<LeftSidebarItem>>",
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
		   , '[]')      AS "rsb_items!: Json<Vec<RightSidebarItem>>"
FROM
	blogs b
		-- Join left sidebar items
		LEFT OUTER JOIN blog_lsb_items AS "b->lsb_items"
						ON "b->lsb_items".blog_id = b.id
		-- Join right sidebar items
		LEFT OUTER JOIN blog_rsb_items AS "b->rsb_items"
						ON "b->rsb_items".blog_id = b.id
WHERE
	  b.id = $1
  AND b.deleted_at IS NULL
GROUP BY
	b.id