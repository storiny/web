"use client";

import { ToastProvider as BannerPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import BannerViewport from "./Viewport";

const BannerProvider = ({ children }: { children: React.ReactNode }) => (
  <BannerPrimitiveProvider
    duration={Infinity}
    label={"Background notification"}
  >
    {children}
    <BannerViewport />
  </BannerPrimitiveProvider>
);

export default BannerProvider;
