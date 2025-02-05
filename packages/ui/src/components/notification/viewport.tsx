"use client";

import { Toast } from "radix-ui";
import React from "react";

import styles from "./notification.module.scss";

const NotificationViewport = (): React.ReactElement => (
  <Toast.Viewport
    className={styles.viewport}
    label={"Notifications ({hotkey})"}
  />
);

export default NotificationViewport;
