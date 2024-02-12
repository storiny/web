import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import styles from "./right-sidebar.module.scss";
import { StoriesRightSidebarProps } from "./right-sidebar.props";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../(default-rsb)/right-sidebar/content"),
  {
    loading: dynamic_loader()
  }
);
const SuspendedContentStoriesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const ContentStoriesRightSidebar = (
  props: StoriesRightSidebarProps
): React.ReactElement => {
  const { tab } = props;
  return (
    <RightSidebar
      className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
    >
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
