"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VIBRATION_PATTERNS } from "@storiny/shared";
import { devConsole } from "@storiny/shared/src/utils/devLog";

import { ToastSeverity } from "~/components/Toast";
import { LOCAL_STORAGE_KEY } from "~/redux/features";
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

export const addToastListeners = (startListening: AppStartListening): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  startListening({
    actionCreator: renderToast,
    effect: (action, listenerApi) => {
      try {
        const state = listenerApi.getState();
        const { severity } = action.payload;

        if (severity === "error" && state.preferences.hapticFeedback) {
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
