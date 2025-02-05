import "server-only";

import {
  BLOG_GLOBAL_THEME_VARIABLE,
  ImageSize,
  StoryCategory
} from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { notFound as not_found } from "next/dist/client/components/not-found";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import { Organization, WithContext } from "schema-dts";

import BlogContextProvider from "~/common/context/blog";
import { get_blog, GetBlogResponse } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";
import { get_cdn_url } from "~/utils/get-cdn-url";

import SyncBlogState from "./sync-state";

const generate_json_ld = (
  blog: GetBlogResponse
): WithContext<Organization> => ({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "@context": "https://schema.org",
  "@type": "Organization",
  name: blog.name,
  description: blog.description,
  url: get_blog_url(blog),
  logo: blog.logo_id
    ? {
        "@type": "ImageObject",
        height: 128 as unknown as string,
        url: get_cdn_url(blog.logo_id, ImageSize.W_128),
        width: 128 as unknown as string
      }
    : undefined
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const BlogLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ identifier: string }>;
}): Promise<React.ReactElement | undefined> => {
  const { identifier } = await params;

  try {
    if (!is_valid_blog_identifier(identifier)) {
      not_found();
    }

    const [headers_value, user_id] = await Promise.all([headers(), get_user()]);
    const pathname = headers_value.get("x-pathname") || "/";
    const blog = await get_blog({
      identifier,
      current_user_id: user_id || undefined
    });
    const fragment = pathname.split("/").slice(3).join("/");

    // Redirect to the preferred pathname.
    if (blog.domain && blog.domain !== identifier) {
      redirect(`/blog/${blog.domain}/${fragment}`);
    } else if (is_snowflake(identifier) && blog.slug !== identifier) {
      redirect(`/blog/${blog.slug}/${fragment}`);
    }

    const nonce = headers_value.get("x-nonce") ?? undefined;
    const json_ld = generate_json_ld(blog);

    return (
      <React.Fragment>
        <script
          dangerouslySetInnerHTML={{
            __html: `
function sync_theme() {
${
  typeof blog.default_theme === "string" && blog.force_theme
    ? `
    try {
        document.documentElement.setAttribute("data-theme", "${blog.default_theme}");
    } catch {}`
    : `
    try {
        let theme = localStorage.getItem("theme") || ${
          blog.default_theme ?? "system"
        };
        
        if (theme === "system") {
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            theme = "dark";
          } else {
            theme = "light";
          }
        }
        
        document.documentElement.setAttribute("data-theme", theme);
    } catch {}`
}
}

sync_theme();

if (typeof window !== "undefined") {
    window["${BLOG_GLOBAL_THEME_VARIABLE}"] = "${
      blog.default_theme || "system"
    }";
}

if (typeof document !== "undefined") {
  document.onload = sync_theme;
}
`
          }}
          nonce={nonce}
        />
        {blog.font_primary && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face {
              font-family: blog-primary;
              font-weight: 100 900;
              font-style: normal;
              src: url("https://fonts.storiny.com/${blog.font_primary}")
                format("woff2");
            }`
            }}
          />
        )}
        {blog.font_secondary && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face {
              font-family: blog-secondary;
              font-weight: 100 900;
              font-style: normal;
              src: url("https://fonts.storiny.com/${blog.font_secondary}")
                format("woff2");
            }`
            }}
          />
        )}
        {blog.font_code && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face {
              font-family: blog-code;
              font-weight: normal;
              font-style: normal;
              src: url("https://fonts.storiny.com/${blog.font_code}")
                format("woff2");
            }`
            }}
          />
        )}
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
            role: blog.is_owner
              ? "owner"
              : blog.is_editor
                ? "editor"
                : blog.is_writer
                  ? "writer"
                  : null
          }}
        >
          <script
            dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
            type="application/ld+json"
          />
          {children}
          <SyncBlogState />
        </BlogContextProvider>
      </React.Fragment>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { generateMetadata } from "./metadata";
export default BlogLayout;
