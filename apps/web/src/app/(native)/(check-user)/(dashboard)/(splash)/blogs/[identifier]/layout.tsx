import "server-only";

import { StoryCategory } from "@storiny/shared";
import { notFound as not_found } from "next/dist/client/components/not-found";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { get_blog } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

import DashboardFooter from "../../common/footer";
import BlogDashboardLeftSidebar from "./left-sidebar";

const BlogDashboardLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ identifier: string }>;
}): Promise<React.ReactElement | undefined> => {
  try {
    const [headers_value, { identifier }] = await Promise.all([
      headers(),
      params
    ]);
    const pathname = headers_value.get("x-pathname") || "/";

    if (!is_valid_blog_identifier(identifier)) {
      not_found();
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent(`/blogs/${identifier}`)}`);
    }

    const blog = await get_blog({
      identifier,
      current_user_id: user_id
    });
    const fragment = pathname.split("/").slice(3).join("/");

    // Redirect to the preferred pathname.
    if (blog.domain && blog.domain !== identifier) {
      redirect(`/blogs/${blog.domain}/${fragment}`);
    } else if (is_snowflake(identifier) && blog.slug !== identifier) {
      redirect(`/blogs/${blog.slug}/${fragment}`);
    }

    // Only allow owner and editors
    if (!blog.is_owner && !blog.is_editor) {
      return not_found();
    }

    return (
      <React.Fragment>
        <BlogContextProvider
          value={{
            ...blog,
            category: blog.category as StoryCategory,
            description: blog.description ?? null,
            logo_id: blog.logo_id ?? null,
            logo_hex: blog.logo_hex ?? null,
            banner_id: blog.banner_id ?? null,
            banner_hex: blog.banner_hex ?? null,
            favicon: blog.favicon ?? null,
            newsletter_splash_hex: blog.newsletter_splash_hex ?? null,
            newsletter_splash_id: blog.newsletter_splash_id ?? null,
            mark_dark: blog.mark_dark ?? null,
            mark_light: blog.mark_light ?? null,
            font_primary: blog.font_primary ?? null,
            font_secondary: blog.font_secondary ?? null,
            font_code: blog.font_code ?? null,
            default_theme: (blog.default_theme ?? null) as
              | "light"
              | "dark"
              | null,
            domain: blog.domain ?? null,
            seo_title: blog.seo_title ?? null,
            seo_description: blog.seo_description ?? null,
            preview_image: blog.preview_image ?? null,
            website_url: blog.website_url ?? null,
            public_email: blog.public_email ?? null,
            github_url: blog.github_url ?? null,
            youtube_url: blog.youtube_url ?? null,
            twitter_url: blog.twitter_url ?? null,
            twitch_url: blog.twitch_url ?? null,
            instagram_url: blog.instagram_url ?? null,
            linkedin_url: blog.linkedin_url ?? null,
            lsb_items: blog.lsb_items.map((item) => ({
              ...item,
              icon: item.icon ?? null
            })),
            rsb_items: blog.rsb_items.map((item) => ({
              ...item,
              icon: item.icon ?? null,
              secondary_text: item.secondary_text ?? null
            })),
            role: blog.is_owner ? "owner" : "editor"
          }}
        >
          <BlogDashboardLeftSidebar />
          {children}
          <DashboardFooter />
        </BlogContextProvider>
      </React.Fragment>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { generateMetadata } from "./metadata";
export default BlogDashboardLayout;
