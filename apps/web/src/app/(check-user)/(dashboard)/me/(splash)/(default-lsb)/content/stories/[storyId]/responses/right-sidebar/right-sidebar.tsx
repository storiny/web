import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import Grow from "~/components/Grow";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { StoryResponsesRightSidebarProps } from "./right-sidebar.props";

const SuspendedContentStoryResponsesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const ContentStoryResponsesRightSidebar = (
  props: StoryResponsesRightSidebarProps
): React.ReactElement | null => {
  const { storyId } = props;
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <SuspendedContentStoryResponsesRightSidebarContent storyId={storyId} />
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default ContentStoryResponsesRightSidebar;
