"use client";

import { ToastProvider as BannerPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import BannerViewport, { BannerViewportProps } from "./Viewport";

const BannerProvider = ({
  children,
  viewportProps
}: {
  children?: React.ReactNode;
  viewportProps?: BannerViewportProps;
}): React.ReactElement => (
  <BannerPrimitiveProvider
    duration={Infinity}
    label={"Background notification"}
  >
    {children}
    <BannerViewport {...viewportProps} />
  </BannerPrimitiveProvider>
);

export default BannerProvider;
