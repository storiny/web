"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import Grow from "~/components/Grow";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";

const SuspendedModerationMutesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const ModerationMutesRightSidebar = (): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <SuspendedModerationMutesRightSidebarContent />
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default ModerationMutesRightSidebar;
