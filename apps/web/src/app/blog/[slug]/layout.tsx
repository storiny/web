import "server-only";

import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { notFound as not_found } from "next/dist/client/components/not-found";
import { headers } from "next/headers";
import React from "react";
import { Organization, WithContext } from "schema-dts";

import { get_blog, GetBlogResponse } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { is_valid_blog_slug } from "~/common/utils";
import { get_user } from "~/common/utils/get-user";
import { get_cdn_url } from "~/utils/get-cdn-url";

import CriticalFonts from "../../fonts/critical";
import BlogContext from "./context";

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
  params: { slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_valid_blog_slug(params.slug)) {
      not_found();
    }

    const user_id = await get_user();
    const blog = await get_blog({
      slug: params.slug,
      current_user_id: user_id || undefined
    });

    const nonce = headers().get("x-nonce") ?? undefined;
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

if (typeof document !== "undefined") {
  document.onload = sync_theme;
}
`
          }}
          nonce={nonce}
        />
        <CriticalFonts />
        {blog.font_primary && (
          // eslint-disable-next-line react/no-unknown-property
          <style global jsx>{`
            @font-face {
              font-family: blog-primary;
              font-weight: normal;
              font-style: normal;
              src: url("https://cdn.storiny.com/user-assets/fonts/${blog.font_primary}.woff2")
                format("woff2");
            }
          `}</style>
        )}
        {blog.font_secondary && (
          // eslint-disable-next-line react/no-unknown-property
          <style global jsx>{`
            @font-face {
              font-family: blog-secondary;
              font-weight: normal;
              font-style: normal;
              src: url("https://cdn.storiny.com/user-assets/fonts/${blog.font_secondary}.woff2")
                format("woff2");
            }
          `}</style>
        )}
        {blog.font_code && (
          // eslint-disable-next-line react/no-unknown-property
          <style global jsx>{`
            @font-face {
              font-family: blog-code;
              font-weight: normal;
              font-style: normal;
              src: url("https://cdn.storiny.com/user-assets/fonts/${blog.font_code}.woff2")
                format("woff2");
            }
          `}</style>
        )}
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
          <script
            dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
            type="application/ld+json"
          />
          {children}
        </BlogContext.Provider>
      </React.Fragment>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { generateMetadata } from "./metadata";
export default BlogLayout;
