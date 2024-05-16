"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { number_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./right-sidebar.module.scss";
import { NewsletterRightSidebarProps } from "./right-sidebar.props";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("../../../../../common/right-sidebar/content"),
  {
    loading: dynamic_loader()
  }
);
const SuspendedBlogContentNewsletterRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const BlogContentNewsletterRightSidebar = (
  props: NewsletterRightSidebarProps
): React.ReactElement | null => {
  const { subscriber_count: subscriber_count_prop } = props;
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const subscriber_count =
    use_app_selector(
      (state) => state.entities.blog_subscriber_counts[blog.id]
    ) || 0;
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  React.useEffect(() => {
    dispatch(
      number_action("blog_subscriber_counts", blog.id, subscriber_count_prop)
    );
  }, [dispatch, blog, subscriber_count_prop]);

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      {subscriber_count ? (
        <React.Fragment>
          <SuspendedBlogContentNewsletterRightSidebarContent
            subscriber_count={subscriber_count}
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

export default BlogContentNewsletterRightSidebar;
