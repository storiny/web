import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetExploreStoriesQuery } from "~/redux/features";

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
    useGetExploreStoriesQuery({
      page,
      category,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
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
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={debouncedQuery} />
      ) : (
        <VirtualizedStoryList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          stories={items}
        />
      )}
    </>
  );
};

export default StoryList;
