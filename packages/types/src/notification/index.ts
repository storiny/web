import { NotificationType } from "@storiny/shared";

import { User } from "../user";

export interface Notification {
  actor: User | null;
  created_at: string;
  id: string;
  is_subscribed?: boolean;
  read_at: string | null;
  rendered_content: string;
  type: NotificationType;
}
