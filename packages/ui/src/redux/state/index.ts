import {
  authInitialState,
  entities_initial_state,
  notifications_initial_state,
  preferencesInitialState,
  toastInitialState
} from "~/redux/features";
import { AppState } from "~/redux/store";

export const initialState: Omit<AppState, "api"> = {
  auth: authInitialState,
  toast: toastInitialState,
  notifications: notifications_initial_state,
  entities: entities_initial_state,
  preferences: preferencesInitialState
};
