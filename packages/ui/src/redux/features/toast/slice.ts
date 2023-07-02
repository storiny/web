"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ToastSeverity } from "~/components/Toast";

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

export default toastSlice.reducer;
