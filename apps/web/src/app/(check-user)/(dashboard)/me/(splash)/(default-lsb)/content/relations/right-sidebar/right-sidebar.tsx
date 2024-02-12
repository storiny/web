"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";
import { self_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import styles from "./right-sidebar.module.scss";
import { RelationsRightSidebarProps } from "./right-sidebar.props";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../(default-rsb)/right-sidebar/content"),
  {
    loading: dynamic_loader()
  }
);
const SuspendedContentRelationsRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const ContentRelationsRightSidebar = (
  props: RelationsRightSidebarProps
): React.ReactElement => {
  const {
    tab,
    pending_friend_request_count: pending_friend_request_count_prop
  } = props;
  const dispatch = use_app_dispatch();
  const pending_friend_request_count =
    use_app_selector(
      (state) => state.entities.self_pending_friend_request_count
    ) || 0;

  React.useEffect(() => {
    dispatch(
      self_action(
        "self_pending_friend_request_count",
        pending_friend_request_count_prop
      )
    );
  }, [dispatch, pending_friend_request_count_prop]);

  return (
    <RightSidebar
      className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
    >
      {tab === "friends" && pending_friend_request_count ? (
        <React.Fragment>
          <SuspendedContentRelationsRightSidebarContent
            pending_friend_request_count={pending_friend_request_count}
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
