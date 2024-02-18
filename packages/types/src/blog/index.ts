import { StoryCategory } from "@storiny/shared";

export interface BlogLeftSidebarItem {
  icon: string | null;
  id: string;
  name: string;
  priority: number;
  target: string;
}

export interface BlogRightSidebarItem {
  icon: string | null;
  id: string;
  primary_text: string;
  priority: number;
  secondary_text: string;
  target: string;
}

interface BlogStatistics {
  editor_count: number;
  follower_count: number;
  story_count: number;
  writer_count: number;
}

interface BlogMarks {
  mark_dark: string | null;
  mark_light: string | null;
}

interface BlogFonts {
  font_code: string | null;
  font_primary: string | null;
  font_secondary: string | null;
}

interface BlogConnections {
  github_id: string | null;
  instagram_id: string | null;
  linkedin_id: string | null;
  public_email: string | null;
  twitch_id: string | null;
  twitter_id: string | null;
  website_url: string | null;
  youtube_id: string | null;
}

interface BlogLayout {
  is_homepage_large_layout: boolean;
  is_story_minimal_layout: boolean;
}

interface BlogSeoProps {
  preview_image: string | null;
  seo_description: string | null;
  seo_title: string | null;
}

interface UserSpecificBlogProps {
  is_editor?: boolean;
  is_following?: boolean;
  is_writer?: boolean;
}

export type Blog = {
  banner_hex: string | null;
  banner_id: string | null;
  category: StoryCategory;
  created_at: string;
  default_theme: "light" | "dark" | null;
  description: string | null;
  domain: string | null;
  favicon: string | null;
  force_theme: boolean;
  has_plus_features: boolean;
  hide_storiny_branding: boolean;
  id: string;
  is_external: boolean;
  logo_hex: string | null;
  logo_id: string | null;
  lsb_items?: BlogLeftSidebarItem[];
  name: string;
  newsletter_splash_hex: string | null;
  newsletter_splash_id: string | null;
  rsb_items?: BlogRightSidebarItem[];
  slug: string;
  user_id: string;
} & BlogMarks &
  BlogFonts &
  BlogLayout &
  BlogStatistics &
  BlogConnections &
  BlogSeoProps &
  UserSpecificBlogProps;
