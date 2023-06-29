import { AppState } from "~/redux/store";

export const selectNotificationState = (state: AppState) => state.notification;
