import { AppState } from "~/redux/store";

import { ToastState } from "./slice";

export const select_toast_state = (state: AppState): ToastState => state.toast;
