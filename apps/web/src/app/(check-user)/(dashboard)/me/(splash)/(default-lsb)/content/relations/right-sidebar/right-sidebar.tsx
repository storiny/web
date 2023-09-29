"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Grow from "../../../../../../../../../../../../packages/ui/src/components/grow";
import { use_media_query } from "../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import RightSidebar from "../../../../../../../../../../../../packages/ui/src/layout/right-sidebar";
import { self_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { RelationsRightSidebarProps } from "./right-sidebar.props";

// Default content

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../(default-rsb)/right-sidebar/content"),
  {
    loading: dynamicLoader()
  }
);

// Relations content

const SuspendedContentRelationsRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamicLoader()
  }
);

const ContentRelationsRightSidebar = (
  props: RelationsRightSidebarProps
): React.ReactElement | null => {
  const { tab, pending_friend_request_count } = props;
  const dispatch = use_app_dispatch();
  const pendingRequestCount =
    use_app_selector(
      (state) => state.entities.self_pending_friend_request_count
    ) || 0;
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  React.useEffect(() => {
    dispatch(
      self_action(
        "self_pending_friend_request_count",
        pending_friend_request_count
      )
    );
  }, [dispatch, pending_friend_request_count]);

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      {tab === "friends" && pendingRequestCount ? (
        <React.Fragment>
          <SuspendedContentRelationsRightSidebarContent
            pending_friend_request_count={pendingRequestCount}
          />
          {/* Push the footer to the bottom of the viewport */}
          <Grow />
        </React.Fragment>
      ) : (
        <SuspendedDashboardRightSidebarContent />
      )}
    </RightSidebar>
  );
};

export default ContentRelationsRightSidebar;
