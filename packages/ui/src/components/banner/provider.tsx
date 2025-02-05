"use client";

import { Toast } from "radix-ui";
import React from "react";

import BannerViewport, { BannerViewportProps } from "./viewport";

const BannerProvider = ({
  children,
  viewport_props
}: {
  children?: React.ReactNode;
  viewport_props?: BannerViewportProps;
}): React.ReactElement => (
  <Toast.ToastProvider duration={Infinity} label={"Background notification"}>
    {children}
    <BannerViewport {...viewport_props} />
  </Toast.ToastProvider>
);

export default BannerProvider;
