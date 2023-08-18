import { Comment } from "../comment";
import { User } from "../user";

export interface ReplyStats {
  like_count: number;
}

interface ReplyOptionalProps {
  comment?: Comment;
  user?: User;
}

interface UserSpecificReplyProps {
  is_liked?: boolean;
}

export type Reply = {
  comment_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  hidden: boolean;
  id: string;
  rendered_content: string;
  user_id: string;
} & ReplyStats &
  ReplyOptionalProps &
  UserSpecificReplyProps;
