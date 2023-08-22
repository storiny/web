import { AppState } from "~/redux/store";

import { ToastState } from "./slice";

export const selectToastState = (state: AppState): ToastState => state.toast;
