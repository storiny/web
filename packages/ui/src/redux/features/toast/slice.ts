"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VIBRATION_PATTERNS } from "@storiny/shared";
import { dev_console } from "../../../../../shared/src/utils/dev-log";

import { ToastSeverity } from "src/components/toast";
import { AppStartListening } from "src/redux/listener-middleware";

export interface ToastState {
  message: string;
  open: boolean;
  severity: ToastSeverity;
}

export const toast_initial_state: ToastState = {
  open: /*    */ false,
  severity: /**/ "blank",
  message: /* */ ""
};

export const toast_slice = createSlice({
  name: "toast",
  initialState: toast_initial_state,
  reducers: {
    set_toast_open: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    render_toast: (
      state,
      action: PayloadAction<{ message: string; severity?: ToastSeverity }>
    ) => {
      const { message, severity } = action.payload;
      state.open = true;
      state.message = message;
      state.severity = severity || toast_initial_state.severity;
    }
  }
});

const { set_toast_open, render_toast } = toast_slice.actions;

export { render_toast, set_toast_open };

export const add_toast_listeners = (
  start_listening: AppStartListening
): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  start_listening({
    actionCreator: render_toast,
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
        dev_console.error(e);
      }
    }
  });
};

export default toast_slice.reducer;
