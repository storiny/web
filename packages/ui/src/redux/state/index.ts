import {
  authInitialState,
  entitiesInitialState,
  notificationsInitialState,
  preferencesInitialState,
  toastInitialState
} from "~/redux/features";
import { AppState } from "~/redux/store";

export const initialState: Omit<AppState, "api"> = {
  auth: authInitialState,
  toast: toastInitialState,
  notifications: notificationsInitialState,
  entities: entitiesInitialState,
  preferences: preferencesInitialState
};
