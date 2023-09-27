import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/ErrorState";
import {
  get_query_error_type,
  use_get_explore_stories_query
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const StoryList = ({
  category,
  debouncedQuery,
  loading: loadingProp
}: {
  category: StoryCategory | "all";
  debouncedQuery: string;
  loading: boolean;
}): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_explore_stories_query({
      page,
      category,
      query: debouncedQuery
    });
  const { items = [], has_more } = data || {};
  const loading = isLoading || loadingProp;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <>
      {loading || (isFetching && page === 1) ? (
        <StoryListSkeleton />
      ) : isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={debouncedQuery} />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          loadMore={loadMore}
          stories={items}
        />
      )}
    </>
  );
};

export default StoryList;
