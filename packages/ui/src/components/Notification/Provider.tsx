"use client";

import { ToastProvider as NotificationPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import NotificationViewport from "./Viewport";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => (
  <NotificationPrimitiveProvider duration={Infinity} label={"Notification"}>
    {children}
    <NotificationViewport />
  </NotificationPrimitiveProvider>
);

export default NotificationProvider;
