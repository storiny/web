import { Notification } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { NotificationProps } from "~/entities/Notification";

export interface VirtualizedNotificationListProps
  extends VirtuosoProps<Notification, any> {
  /**
   * Flag indicating whether there are more notifications to render.
   */
  hasMore: boolean;
  /**
   * A callback function to fetch more notifications.
   */
  loadMore: () => void;
  /**
   * Props passed down to individual notification entities.
   */
  notificationProps?: Partial<NotificationProps>;
  /**
   * Array of notifications to render.
   */
  notifications: Notification[];
}
