"use client";

import { Toast } from "radix-ui";
import React from "react";

import ToastViewport from "./viewport";

const ToastProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <Toast.ToastProvider duration={5000} label={"Toast notification"}>
    {children}
    <ToastViewport />
  </Toast.ToastProvider>
);

export default ToastProvider;
