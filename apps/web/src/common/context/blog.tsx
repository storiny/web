import { Blog } from "@storiny/types";
import React from "react";

export type BlogContextValue = Pick<
  Blog,
  | "id"
  | "slug"
  | "description"
  | "category"
  | "logo_id"
  | "logo_hex"
  | "banner_hex"
  | "banner_id"
  | "favicon"
  | "name"
  | "user_id"
  | "default_theme"
  | "force_theme"
  | "font_primary"
  | "font_secondary"
  | "font_code"
  | "github_url"
  | "has_plus_features"
  | "instagram_url"
  | "is_homepage_large_layout"
  | "is_story_minimal_layout"
  | "is_external"
  | "linkedin_url"
  | "mark_light"
  | "mark_dark"
  | "newsletter_splash_hex"
  | "newsletter_splash_id"
  | "twitter_url"
  | "twitch_url"
  | "youtube_url"
  | "website_url"
  | "public_email"
  | "domain"
  | "lsb_items"
  | "rsb_items"
  | "hide_storiny_branding"
  | "is_following"
  | "rsb_items_label"
> & {
  mutate: (next_state: Partial<Blog>) => void;
  role: "owner" | "editor" | "writer" | null;
};

export const BlogContext = React.createContext<BlogContextValue>(
  {} as unknown as BlogContextValue
);

const BlogContextProvider = ({
  children,
  value
}: {
  children: React.ReactNode;
  value: Omit<BlogContextValue, "mutate">;
}): React.ReactElement => {
  const [blog, set_blog] =
    React.useState<Omit<BlogContextValue, "mutate">>(value);

  return (
    <BlogContext.Provider
      value={{
        ...blog,
        mutate: (values) =>
          set_blog((prev_state) => ({ ...prev_state, ...values }))
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const use_blog_context = (): BlogContextValue =>
  React.useContext(BlogContext);

export default BlogContextProvider;
