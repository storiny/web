import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import styles from "./right-sidebar.module.scss";
import { DraftsRightSidebarProps } from "./right-sidebar.props";

// Default content

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../(default-rsb)/right-sidebar/content"),
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
): React.ReactElement => {
  const { tab, latest_draft } = props;
  return (
    <RightSidebar
      className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
    >
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
