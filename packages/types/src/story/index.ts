import { Tag } from "../tag";
import { User } from "../user";

export interface StoryStats {
  like_count: number;
  read_count: number;
}

interface UserSpecificStoryProps {
  is_bookmarked?: boolean;
  is_liked?: boolean;
}

export interface Story extends UserSpecificStoryProps {
  created_at: string;
  description: string | null;
  id: string;
  slug: string;
  splash_hex: string | null;
  splash_id: string | null;
  stats: StoryStats;
  tags: Tag[];
  title: string;
  user: User;
  user_id: string;
  word_count: number;
}
