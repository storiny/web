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

export type Story = {
  created_at: string;
  deleted_at: string | null;
  description: string | null;
  edited_at: string | null;
  id: string;
  published_at: string | null;
  slug: string;
  splash_hex: string | null;
  splash_id: string | null;
  stats: StoryStats;
  tags: Tag[];
  title: string;
  user_id: string;
  word_count: number;
} & StoryOptionalProps &
  UserSpecificStoryProps;
