import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import {
  get_query_error_type,
  use_get_user_stories_query
} from "~/redux/features";

import { ProfileEntitySortValue } from "../../client";

const EmptyState = dynamic(() => import("../../empty-state"), {
  loading: dynamicLoader()
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
    use_get_user_stories_query({
      page,
      sort,
      userId,
      query: debouncedQuery
    });
  const { items = [], has_more } = data || {};
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
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState entityType={"stories"} query={query} username={username} />
      ) : isLoading || isTyping || (isFetching && page === 1) ? (
        <StoryListSkeleton />
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

export default React.memo(StoriesTab);
