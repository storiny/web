"use client";

import { ToastProvider as ToastPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import ToastViewport from "./Viewport";

const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastPrimitiveProvider duration={5000} label={"Toast notification"}>
    {children}
    <ToastViewport />
  </ToastPrimitiveProvider>
);

export default ToastProvider;
