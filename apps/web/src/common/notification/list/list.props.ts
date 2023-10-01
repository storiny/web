import { Notification } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { NotificationProps } from "~/entities/notification";

export interface VirtualizedNotificationListProps
  extends VirtuosoProps<Notification, any> {
  /**
   * Flag indicating whether there are more notifications to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more notifications.
   */
  load_more: () => void;
  /**
   * Props passed down to individual notification entities.
   */
  notification_props?: Partial<NotificationProps>;
  /**
   * Array of notifications to render.
   */
  notifications: Notification[];
}
