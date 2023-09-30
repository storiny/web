"use client";

import { ToastViewportProps, Viewport } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import styles from "./banner.module.scss";

export type BannerViewportProps = ToastViewportProps &
  React.ComponentPropsWithoutRef<"div">;

const BannerViewport = (props: BannerViewportProps): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <Viewport
      hotkey={["F10"]}
      label={"Background notifications ({hotkey})"}
      {...rest}
      className={clsx(styles.viewport, className)}
    />
  );
};

export default BannerViewport;
