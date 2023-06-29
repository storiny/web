import dynamic from "next/dynamic";
import React from "react";

import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import SuspenseLoader from "~/common/suspense-loader";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import { getQueryErrorType, useGetUserStoriesQuery } from "~/redux/features";

import { ProfileEntitySortValue } from "../../client";

const EmptyState = dynamic(() => import("../../empty-state"), {
  loading: () => <SuspenseLoader />,
});

interface Props {
  query: string;
  sort: ProfileEntitySortValue;
  userId: string;
  username: string;
}

const StoriesTab = (props: Props): React.ReactElement => {
  const { query, sort, userId, username } = props;
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetUserStoriesQuery({
      page,
      sort,
      userId,
      query: debouncedQuery,
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <>
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching },
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState entityType={"stories"} query={query} username={username} />
      ) : isLoading || isTyping ? (
        <StoryListSkeleton />
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

export default React.memo(StoriesTab);
