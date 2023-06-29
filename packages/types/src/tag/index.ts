interface UserSpecificTagProps {
  is_following?: boolean;
}

export interface Tag extends UserSpecificTagProps {
  created_at: string;
  follower_count: number;
  id: string;
  name: string;
  story_count: number;
}
