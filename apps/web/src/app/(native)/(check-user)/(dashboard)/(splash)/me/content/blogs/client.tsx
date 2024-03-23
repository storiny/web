"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { BlogListSkeleton, VirtualizedBlogList } from "~/common/blog";
import { dynamic_loader } from "~/common/dynamic";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import {
  get_query_error_type,
  self_action,
  use_get_blogs_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../common/dashboard-title";
import { BlogsProps } from "./blogs.props";
import CreateBlog from "./create-blog";
import ContentBlogsRightSidebar from "./right-sidebar";
import BlogRequests from "./right-sidebar/blog-requests";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

// Status header

const StatusHeader = ({
  blog_count: blog_count_prop,
  can_create_blog
}: BlogsProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const blog_count =
    use_app_selector((state) => state.entities.self_blog_count) || 0;
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));

  React.useEffect(() => {
    dispatch(self_action("self_blog_count", blog_count_prop));
  }, [dispatch, blog_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"} style={{ width: "100%" }}>
        {blog_count === 0 ? (
          "You are not a member of any blog."
        ) : (
          <>
            You are a member of{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(blog_count)}
            </span>{" "}
            {blog_count === 1 ? "blog" : "blogs"}.
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      {is_smaller_than_desktop && <BlogRequests />}
      <CreateBlog disabled={!can_create_blog} />
    </div>
  );
};

const ContentBlogsClient = (props: BlogsProps): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blogs_query({
    page
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Blogs</DashboardTitle>
        <StatusHeader {...props} />
        {is_loading || (is_fetching && page === 1) ? (
          <BlogListSkeleton />
        ) : is_error ? (
          <ErrorState
            auto_size
            component_props={{
              button: { loading: is_fetching }
            }}
            retry={refetch}
            type={get_query_error_type(error)}
          />
        ) : !is_fetching && !items.length ? (
          <EmptyState />
        ) : (
          <VirtualizedBlogList
            blogs={items}
            has_more={Boolean(has_more)}
            load_more={load_more}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentBlogsRightSidebar {...props} />
    </React.Fragment>
  );
};

export default ContentBlogsClient;
