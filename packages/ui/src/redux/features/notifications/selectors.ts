import { UnreadNotificationsStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

// Predicate

export const selectReadNotification =
  (notificationId: string) =>
  (state: AppState): boolean =>
    state.notifications.readNotifications[notificationId];

// Integral

export const selectUnreadNotificationCount = (state: AppState): number =>
  state.notifications.unreadCount;

// Misc

export const selectUnreadNotificationsStatus = (
  state: AppState
): UnreadNotificationsStatus => state.notifications.status;
