import { UnreadNotificationsStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

export const select_read_notification =
  (notificationId: string) =>
  (state: AppState): boolean =>
    state.notifications.read_notifications[notificationId];

export const select_unread_notification_count = (state: AppState): number =>
  state.notifications.unread_count;

export const select_notifications_status = (
  state: AppState
): UnreadNotificationsStatus => state.notifications.status;
