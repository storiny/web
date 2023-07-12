import {
  authInitialState,
  bannerInitialState,
  entitiesInitialState,
  notificationInitialState,
  notificationsInitialState,
  preferencesInitialState,
  toastInitialState
} from "~/redux/features";
import { AppState } from "~/redux/store";

export const initialState: Omit<AppState, "api"> = {
  auth: authInitialState,
  banner: bannerInitialState,
  toast: toastInitialState,
  notification: notificationInitialState,
  notifications: notificationsInitialState,
  entities: entitiesInitialState,
  preferences: preferencesInitialState
};
