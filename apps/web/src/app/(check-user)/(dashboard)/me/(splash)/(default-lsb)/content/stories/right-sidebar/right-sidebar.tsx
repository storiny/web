import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import Grow from "~/components/Grow";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { StoriesRightSidebarProps } from "./right-sidebar.props";

// Default content

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../(default-rsb)/right-sidebar/content"),
  {
    loading: () => <SuspenseLoader />
  }
);

// Stories content

const SuspendedContentStoriesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const ContentStoriesRightSidebar = (
  props: StoriesRightSidebarProps
): React.ReactElement | null => {
  const { tab } = props;
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      {tab === "published" ? (
        <SuspendedDashboardRightSidebarContent />
      ) : (
        <React.Fragment>
          <SuspendedContentStoriesRightSidebarContent />
          {/* Push the footer to the bottom of the viewport */}
          <Grow />
        </React.Fragment>
      )}
    </RightSidebar>
  );
};

export default ContentStoriesRightSidebar;
