import {
  auth_initial_state,
  entities_initial_state,
  notifications_initial_state,
  preferences_initial_state,
  toast_initial_state
} from "~/redux/features";
import { AppState } from "~/redux/store";

export const initial_state: Omit<AppState, "api"> = {
  auth: auth_initial_state,
  toast: toast_initial_state,
  notifications: notifications_initial_state,
  entities: entities_initial_state,
  preferences: preferences_initial_state
};
