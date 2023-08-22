import { AppState } from "~/redux/store";

import { NotificationState } from "./slice";

export const selectNotificationState = (state: AppState): NotificationState =>
  state.notification;
