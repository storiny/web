"use client";

import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const DefaultDashboardRightSidebar = (): React.ReactElement => (
  <RightSidebar className={css["above-desktop"]}>
    <SuspendedDashboardRightSidebarContent />
  </RightSidebar>
);

export default DefaultDashboardRightSidebar;
