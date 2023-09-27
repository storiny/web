import { AppState } from "~/redux/store";

export const select_theme = (state: AppState): "light" | "dark" | "system" =>
  state.preferences.theme;

export const select_alert_visibility =
  (type: "appearance" | "accessibility") =>
  (state: AppState): boolean =>
    state.preferences[
      type === "appearance"
        ? "show_appearance_alert"
        : "show_accessibility_alert"
    ];

export const select_haptic_feedback = (state: AppState): boolean =>
  state.preferences.haptic_feedback;
