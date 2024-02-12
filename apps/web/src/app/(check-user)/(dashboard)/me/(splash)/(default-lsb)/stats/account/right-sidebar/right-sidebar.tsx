"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import styles from "./right-sidebar.module.scss";

const SuspendedAccountStatsRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const AccountStatsRightSidebar = (): React.ReactElement => (
  <RightSidebar
    className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
  >
    <SuspendedAccountStatsRightSidebarContent />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default AccountStatsRightSidebar;
