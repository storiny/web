"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Grow from "~/components/Grow";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { self_action } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

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
  const dispatch = useAppDispatch();
  const pendingRequestCount =
    useAppSelector(
      (state) => state.entities.self_pending_friend_request_count
    ) || 0;
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  React.useEffect(() => {
    dispatch(
      self_action(
        "self_pending_friend_request_count",
        pending_friend_request_count
      )
    );
  }, [dispatch, pending_friend_request_count]);

  if (!shouldRender) {
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
