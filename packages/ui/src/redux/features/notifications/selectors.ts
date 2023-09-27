import { UnreadNotificationsStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

export const select_read_notification =
  (notification_id: string) =>
  (state: AppState): boolean =>
    state.notifications.read_notifications[notification_id];

export const select_unread_notification_count = (state: AppState): number =>
  state.notifications.unread_count;

export const select_notifications_status = (
  state: AppState
): UnreadNotificationsStatus => state.notifications.status;
