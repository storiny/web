import {
  StoryAgeRestriction,
  StoryCategory,
  StoryLicense,
  StoryVisibility
} from "@storiny/shared";

import { Tag } from "../tag";
import { User } from "../user";

export interface StoryStats {
  comment_count: number;
  like_count: number;
  read_count: number;
}

interface StoryOptionalProps {
  user?: User;
}

interface UserSpecificStoryProps {
  is_bookmarked?: boolean;
  is_liked?: boolean;
}

interface StorySeoProps {
  canonical_url: string | null;
  seo_description: string | null;
  seo_title: string | null;
}

type StoryTag = Omit<
  Tag,
  "created_at" | "follower_count" | "is_following" | "story_count"
> &
  Partial<
    Pick<Tag, "created_at" | "follower_count" | "is_following" | "story_count">
  >;

export type Story = {
  age_restriction: StoryAgeRestriction;
  blog?: { domain: string | null; id: string; name: string; slug: string };
  category: StoryCategory;
  contributors?: User[];
  created_at: string;
  deleted_at: string | null;
  description: string | null;
  disable_comments: boolean;
  disable_public_revision_history: boolean;
  disable_toc: boolean;
  doc_key: string;
  edited_at: string | null;
  first_published_at: string | null;
  id: string;
  license: StoryLicense;
  preview_image: string | null;
  published_at: string | null;
  // Received from the server only when reading the story
  reading_session_token?: string;
  slug: string;
  splash_hex: string | null;
  splash_id: string | null;
  tags: StoryTag[];
  title: string;
  user_id: string;
  visibility: StoryVisibility;
  word_count: number;
} & StoryStats &
  StorySeoProps &
  StoryOptionalProps &
  UserSpecificStoryProps;

export type DocUserRole = "blog-member" | "editor" | "viewer" | "reader";
