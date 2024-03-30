"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/error-state";
import PageTitle from "~/entities/page-title";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import {
  get_query_error_type,
  use_get_blog_editors_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import styles from "../archive/styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const Page = (): React.ReactElement => {
  const blog = use_blog_context();
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state<typeof page>(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_editors_query({
    page,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <>
      <PageTitle
        back_button_href={"/"}
        className={clsx(styles["page-title"], css["no-sidenav"])}
      >
        Editors
      </PageTitle>
      {is_error ? (
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
      ) : is_loading || (is_fetching && page === 1) ? (
        <UserListSkeleton />
      ) : (
        <VirtualizedUserList
          has_more={Boolean(has_more)}
          load_more={load_more}
          users={items}
        />
      )}
    </>
  );
};

export default Page;
