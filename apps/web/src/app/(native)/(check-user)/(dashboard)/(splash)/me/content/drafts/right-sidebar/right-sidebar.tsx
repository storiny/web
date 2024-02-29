import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { DraftsRightSidebarProps } from "./right-sidebar.props";

// Default content

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../../common/right-sidebar/content"),
  {
    loading: dynamic_loader()
  }
);

// Draft content

const SuspendedContentDraftsRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const ContentDraftsRightSidebar = (
  props: DraftsRightSidebarProps
): React.ReactElement | null => {
  const { tab, latest_draft } = props;
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      {tab === "pending" && !latest_draft ? (
        <SuspendedDashboardRightSidebarContent />
      ) : (
        <React.Fragment>
          <SuspendedContentDraftsRightSidebarContent {...props} />
          {/* Push the footer to the bottom of the viewport */}
          <Grow />
        </React.Fragment>
      )}
    </RightSidebar>
  );
};

export default ContentDraftsRightSidebar;
