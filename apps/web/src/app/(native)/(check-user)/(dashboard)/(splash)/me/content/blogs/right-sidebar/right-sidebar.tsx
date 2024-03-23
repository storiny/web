"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { self_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { BlogsRightSidebarProps } from "./right-sidebar.props";

const SuspendedContentBlogsRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const ContentBlogsRightSidebar = (
  props: BlogsRightSidebarProps
): React.ReactElement | null => {
  const { pending_blog_request_count: pending_blog_request_count_prop } = props;
  const dispatch = use_app_dispatch();
  const pending_blog_request_count =
    use_app_selector(
      (state) => state.entities.self_pending_blog_request_count
    ) || 0;
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  React.useEffect(() => {
    dispatch(
      self_action(
        "self_pending_blog_request_count",
        pending_blog_request_count_prop
      )
    );
  }, [dispatch, pending_blog_request_count_prop]);

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <SuspendedContentBlogsRightSidebarContent
        pending_blog_request_count={pending_blog_request_count}
      />
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default ContentBlogsRightSidebar;
