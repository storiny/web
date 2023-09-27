"use client";

import React from "react";

import Toast, { ToastProvider } from "~/components/Toast";
import { select_toast_state } from "~/redux/features/toast/selectors";
import { set_toast_open } from "~/redux/features/toast/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

const ToastWithState = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const { open, severity, message } = use_app_selector(select_toast_state);

  return (
    <ToastProvider>
      <Toast
        onOpenChange={(next_state): void => {
          dispatch(set_toast_open(next_state));
        }}
        open={open}
        severity={severity}
      >
        {message}
      </Toast>
    </ToastProvider>
  );
};

export default ToastWithState;
