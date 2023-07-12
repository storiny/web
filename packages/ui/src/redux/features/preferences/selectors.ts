import { AppState } from "~/redux/store";

export const selectTheme = (state: AppState): "light" | "dark" | "system" =>
  state.preferences.theme;
