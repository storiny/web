"use client";

import { Viewport } from "@radix-ui/react-toast";
import React from "react";

import styles from "./Toast.module.scss";

const ToastViewport = (): React.ReactElement => (
  <Viewport
    className={styles.viewport}
    hotkey={["F9"]}
    label={"Toast notifications ({hotkey})"}
  />
);

export default ToastViewport;
