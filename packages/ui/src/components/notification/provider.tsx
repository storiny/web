"use client";

import { Toast } from "radix-ui";
import React from "react";

import NotificationViewport from "./viewport";

const NotificationProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <Toast.ToastProvider duration={Infinity} label={"Notification"}>
    {children}
    <NotificationViewport />
  </Toast.ToastProvider>
);

export default NotificationProvider;
