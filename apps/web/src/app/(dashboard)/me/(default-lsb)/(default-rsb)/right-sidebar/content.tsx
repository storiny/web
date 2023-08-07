"use client";

import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/Typography";

import styles from "./right-sidebar.module.scss";

const SuspendedDashboardRightSidebarContent = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles.content)}>
    <Typography className={clsx("t-medium", "t-minor")}>
      Right sidebar
    </Typography>
  </div>
);

export default SuspendedDashboardRightSidebarContent;
