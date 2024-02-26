"use client";

import React from "react";

import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/error-state";
import PageTitle from "~/entities/page-title";
import {
  get_query_error_type,
  use_get_blog_editors_query
} from "~/redux/features";

import { use_blog_context } from "../../context";
import styles from "../archive/styles.module.scss";

const Page = (): React.ReactElement => {
  const blog = use_blog_context();
  const [page, set_page] = React.useState<number>(1);
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
      <PageTitle back_button_href={"/"} className={styles["page-title"]}>
        Editors
      </PageTitle>
      {is_error || (!is_fetching && !items.length) ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
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
