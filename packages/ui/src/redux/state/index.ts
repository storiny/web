import { authInitialState } from "~/redux/features";
import { bannerInitialState } from "~/redux/features";
import { entitiesInitialState } from "~/redux/features";
import { notificationInitialState } from "~/redux/features";
import { preferencesInitialState } from "~/redux/features";
import { toastInitialState } from "~/redux/features";
import { AppState } from "~/redux/store";

export const initialState: Omit<AppState, "api"> = {
  auth: authInitialState,
  banner: bannerInitialState,
  toast: toastInitialState,
  notification: notificationInitialState,
  entities: entitiesInitialState,
  preferences: preferencesInitialState
};
