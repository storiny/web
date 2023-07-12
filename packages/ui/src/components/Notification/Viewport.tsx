"use client";

import { Viewport } from "@radix-ui/react-toast";
import React from "react";

import styles from "./Notification.module.scss";

const NotificationViewport = (): React.ReactElement => (
  <Viewport className={styles.viewport} label={"Notifications ({hotkey})"} />
);

export default NotificationViewport;
