"use client";

import { Viewport } from "@radix-ui/react-toast";
import React from "react";

import styles from "./Notification.module.scss";

const NotificationViewport = () => (
  <Viewport className={styles.viewport} label={"Notifications ({hotkey})"} />
);

export default NotificationViewport;
