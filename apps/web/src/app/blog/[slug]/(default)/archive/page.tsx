"use client";
 
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  use_get_blog_archive_query
} from "~/redux/features";

import { use_blog_context } from "../../context";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

interface Props {
  month?: number;
  year?: number;
}

const Page = ({ year, month }: Props): React.ReactElement => {
  const blog = use_blog_context();
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_archive_query({
    page,
    blog_id: blog.id,
    year,
    month
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  React.useEffect(() => {
    set_page(1);
  }, [year, month]);

  return (
    <>
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
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
        />
      )}
    </>
  );
};

export default Page;
