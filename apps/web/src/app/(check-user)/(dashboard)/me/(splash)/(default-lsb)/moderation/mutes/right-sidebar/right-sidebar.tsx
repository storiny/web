"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";

const SuspendedModerationMutesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const ModerationMutesRightSidebar = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
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
