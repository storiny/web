"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VIBRATION_PATTERNS } from "@storiny/shared";
import { devConsole } from "@storiny/shared/src/utils/devLog";

import { ToastSeverity } from "~/components/Toast";
import { AppStartListening } from "~/redux/listenerMiddleware";

export interface ToastState {
  message: string;
  open: boolean;
  severity: ToastSeverity;
}

export const toastInitialState: ToastState = {
  open: false,
  severity: "blank",
  message: ""
};

export const toastSlice = createSlice({
  name: "toast",
  initialState: toastInitialState,
  reducers: {
    setToastOpen: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    renderToast: (
      state,
      action: PayloadAction<{ message: string; severity?: ToastSeverity }>
    ) => {
      const { message, severity } = action.payload;

      state.open = true;
      state.message = message;
      state.severity = severity || toastInitialState.severity;
    }
  }
});

const { setToastOpen, renderToast } = toastSlice.actions;

export { renderToast, setToastOpen };

export const addToastListeners = (start_listening: AppStartListening): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  start_listening({
    actionCreator: renderToast,
    effect: (action, listener_api) => {
      try {
        const state = listener_api.getState();
        const { severity } = action.payload;

        if (severity === "error" && state.preferences.haptic_feedback) {
          if ("vibrate" in navigator) {
            navigator.vibrate(VIBRATION_PATTERNS.error); // Vibrate on error
          }
        }
      } catch (e) {
        devConsole.error(e);
      }
    }
  });
};

export default toastSlice.reducer;
