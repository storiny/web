import { clsx } from "clsx";
import React from "react";

import { get_blog } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import BlogRightSidebar from "~/layout/blog-right-sidebar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

import BlogContext from "./context";

const BlogLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: { slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();
    const blog = await get_blog({
      slug: params.slug,
      current_user_id: user_id || undefined
    });

    return (
      <BlogContext.Provider
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
          role: blog.is_owner
            ? "owner"
            : blog.is_editor
              ? "editor"
              : blog.is_writer
                ? "writer"
                : null
        }}
      >
        <div
          className={clsx(
            css["grid"],
            css["grid-container"],
            css["no-sidenav"]
          )}
        >
          <BlogNavbar />
          <BlogLeftSidebar />
          <main data-root={"true"}>{children}</main>
          <BlogRightSidebar />
          <SplashScreen />
        </div>
      </BlogContext.Provider>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export default BlogLayout;
