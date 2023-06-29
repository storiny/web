"use client";

import React from "react";

import Toast, { ToastProvider } from "~/components/Toast";
import { selectToastState } from "~/redux/features/toast/selectors";
import { setToastOpen } from "~/redux/features/toast/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const ToastWithState = () => {
  const dispatch = useAppDispatch();
  const { open, severity, message } = useAppSelector(selectToastState);

  return (
    <ToastProvider>
      <Toast
        onOpenChange={(newState) => dispatch(setToastOpen(newState))}
        open={open}
        severity={severity}
      >
        {message}
      </Toast>
    </ToastProvider>
  );
};

export default ToastWithState;
