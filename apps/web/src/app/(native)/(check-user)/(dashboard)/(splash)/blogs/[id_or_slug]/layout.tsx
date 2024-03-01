import "server-only";

import { notFound as not_found } from "next/dist/client/components/not-found";
import { redirect } from "next/navigation";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { get_blog } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { is_valid_blog_slug } from "~/common/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";

import DashboardFooter from "../../common/footer";
import BlogDashboardLeftSidebar from "./left-sidebar";

const BlogDashboardLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const { id_or_slug } = params;

    if (!is_valid_blog_slug(id_or_slug) || !is_snowflake(id_or_slug)) {
      not_found();
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent(`/blogs/${id_or_slug}`)}`);
    }

    const blog = await get_blog({
      identifier: id_or_slug,
      current_user_id: user_id
    });

    // Only allow owner and editors
    if (!blog.is_owner && !blog.is_editor) {
      return not_found();
    }

    return (
      <React.Fragment>
        <BlogContextProvider
          value={{
            ...blog,
            description: blog.description ?? null,
            logo_id: blog.logo_id ?? null,
            logo_hex: blog.logo_hex ?? null,
            banner_id: blog.banner_id ?? null,
            banner_hex: blog.banner_hex ?? null,
            newsletter_splash_hex: blog.newsletter_splash_hex ?? null,
            newsletter_splash_id: blog.newsletter_splash_id ?? null,
            mark_dark: blog.mark_dark ?? null,
            mark_light: blog.mark_light ?? null,
            default_theme: (blog.default_theme ?? null) as
              | "light"
              | "dark"
              | null,
            domain: blog.domain ?? null,
            website_url: blog.website_url ?? null,
            public_email: blog.public_email ?? null,
            github_id: blog.github_id ?? null,
            youtube_id: blog.youtube_id ?? null,
            twitter_id: blog.twitter_id ?? null,
            twitch_id: blog.twitch_id ?? null,
            instagram_id: blog.instagram_id ?? null,
            linkedin_id: blog.linkedin_id ?? null,
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
