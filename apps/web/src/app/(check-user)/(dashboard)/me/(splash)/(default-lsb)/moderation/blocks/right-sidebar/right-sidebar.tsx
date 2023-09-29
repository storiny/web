"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Grow from "../../../../../../../../../../../../packages/ui/src/components/grow";
import { use_media_query } from "../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import RightSidebar from "../../../../../../../../../../../../packages/ui/src/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";

const SuspendedModerationBlocksRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamicLoader()
  }
);

const ModerationBlocksRightSidebar = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <SuspendedModerationBlocksRightSidebarContent />
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default ModerationBlocksRightSidebar;
