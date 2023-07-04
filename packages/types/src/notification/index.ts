import { User } from "../user";

export enum NotificationType {
  // System
  SYSTEM,
  LOGIN_ATTEMPT,
  // Public
  FRIEND_REQ_ACCEPT,
  FRIEND_REQ_RECEIVED,
  FOLLOWER_ADD,
  COMMENT_ADD,
  REPLY_ADD,
  STORY_MENTION,
  STORY_LIKE,
  STORY_ADD_BY_USER,
  STORY_ADD_BY_TAG
}

export interface Notification {
  actor: User | null;
  created_at: string;
  id: string;
  read_at: string | null;
  rendered_content: string;
  type: NotificationType;
}
