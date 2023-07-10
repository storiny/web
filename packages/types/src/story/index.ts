import { Tag } from "../tag";
import { User } from "../user";

export interface StoryStats {
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
  description: string | null;
  id: string;
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
