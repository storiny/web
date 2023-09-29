"use client";

import { ToastProvider as NotificationPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import NotificationViewport from "./viewport";

const NotificationProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <NotificationPrimitiveProvider duration={Infinity} label={"Notification"}>
    {children}
    <NotificationViewport />
  </NotificationPrimitiveProvider>
);

export default NotificationProvider;
