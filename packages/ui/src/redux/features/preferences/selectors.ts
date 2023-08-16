import { AppState } from "~/redux/store";

export const selectTheme = (state: AppState): "light" | "dark" | "system" =>
  state.preferences.theme;

export const selectAlertVisibility =
  (type: "appearance" | "accessibility") =>
  (state: AppState): boolean =>
    state.preferences[
      type === "appearance" ? "showAppearanceAlert" : "showAccessibilityAlert"
    ];

export const selectHapticFeedback = (state: AppState): boolean =>
  state.preferences.hapticFeedback;
