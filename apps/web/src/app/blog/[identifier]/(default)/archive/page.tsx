"use client";

import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_blog_archive,
  use_get_blog_archive_query
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

interface Props {
  month?: number;
  year?: number;
}

const Page = ({ year, month }: Props): React.ReactElement => {
  const blog = use_blog_context();
  const page = use_pagination(
    select_blog_archive({ page: 1, blog_id: blog.id, year, month })
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
  ] = use_get_blog_archive_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      blog_id: blog.id,
      year,
      month
    },
    [blog.id, year, month]
  );

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        blog_id: blog.id,
        year,
        month
      },
      true
    );
  }, [blog.id, month, page, trigger, year]);

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
