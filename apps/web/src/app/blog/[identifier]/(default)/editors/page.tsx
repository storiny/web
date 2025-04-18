"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/error-state";
import PageTitle from "~/entities/page-title";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_blog_editors,
  use_get_blog_editors_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import styles from "../archive/styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const Page = (): React.ReactElement => {
  const blog = use_blog_context();
  const page = use_pagination(
    select_blog_editors({ page: 1, blog_id: blog.id })
  );
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_blog_editors_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      blog_id: blog.id
    },
    [blog.id]
  );

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        blog_id: blog.id
      },
      true
    );
  }, [blog.id, page, trigger]);

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
