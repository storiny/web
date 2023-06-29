import { AppState } from "~/redux/store";

export const selectToastState = (state: AppState) => state.toast;
