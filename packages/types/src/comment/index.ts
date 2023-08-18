import { Story } from "../story";
import { User } from "../user";

export interface CommentStats {
  like_count: number;
  reply_count: number;
}

interface CommentOptionalProps {
  story?: Story;
  user?: User;
}

interface UserSpecificCommentProps {
  is_liked?: boolean;
}

export type Comment = {
  content: string;
  created_at: string;
  edited_at: string | null;
  hidden: boolean;
  id: string;
  rendered_content: string;
  story_id: string;
  user_id: string;
} & CommentStats &
  CommentOptionalProps &
  UserSpecificCommentProps;
