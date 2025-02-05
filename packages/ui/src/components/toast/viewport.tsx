"use client";

import { Toast } from "radix-ui";
import React from "react";

import styles from "./toast.module.scss";

const ToastViewport = (): React.ReactElement => (
  <Toast.Viewport
    className={styles.viewport}
    hotkey={["F9"]}
    label={"Toast notifications ({hotkey})"}
  />
);

export default ToastViewport;
