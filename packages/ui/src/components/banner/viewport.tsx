"use client";

import clsx from "clsx";
import { Toast } from "radix-ui";
import React from "react";

import styles from "./banner.module.scss";

export type BannerViewportProps = Toast.ToastViewportProps &
  React.ComponentPropsWithoutRef<"div">;

const BannerViewport = (props: BannerViewportProps): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <Toast.Viewport
      hotkey={["F10"]}
      label={"Background notifications ({hotkey})"}
      {...rest}
      className={clsx(styles.viewport, className)}
    />
  );
};

export default BannerViewport;
