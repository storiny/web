import { AppState } from "~/redux/store";

export const selectTheme = (state: AppState) => state.preferences.theme;
