import { User } from "../user";

export enum NotificationType {
  // System
  SYSTEM /*             */ = 1,
  LOGIN_ATTEMPT /*      */ = 2,
  // Public
  FRIEND_REQ_ACCEPT /*  */ = 3,
  FRIEND_REQ_RECEIVED /**/ = 4,
  FOLLOWER_ADD /*       */ = 5,
  COMMENT_ADD /*        */ = 6,
  REPLY_ADD /*          */ = 7,
  STORY_MENTION /*      */ = 8,
  STORY_LIKE /*         */ = 9,
  STORY_ADD_BY_USER /*  */ = 10,
  STORY_ADD_BY_TAG /*   */ = 11
}

export interface Notification {
  actor: User | null;
  created_at: string;
  id: string;
  read_at: string | null;
  rendered_content: string;
  type: NotificationType;
}
