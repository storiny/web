"use client";

import { ToastProvider as BannerPrimitiveProvider } from "@radix-ui/react-toast";
import React from "react";

import BannerViewport, { BannerViewportProps } from "./viewport";

const BannerProvider = ({
  children,
  viewport_props
}: {
  children?: React.ReactNode;
  viewport_props?: BannerViewportProps;
}): React.ReactElement => (
  <BannerPrimitiveProvider
    duration={Infinity}
    label={"Background notification"}
  >
    {children}
    <BannerViewport {...viewport_props} />
  </BannerPrimitiveProvider>
);

export default BannerProvider;
