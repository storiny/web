import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Grow from "../../../../../../../../../../../../../../packages/ui/src/components/grow";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import RightSidebar from "../../../../../../../../../../../../../../packages/ui/src/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { StoryResponsesRightSidebarProps } from "./right-sidebar.props";

const SuspendedContentStoryResponsesRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamicLoader()
  }
);

const ContentStoryResponsesRightSidebar = (
  props: StoryResponsesRightSidebarProps
): React.ReactElement | null => {
  const { storyId } = props;
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
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
