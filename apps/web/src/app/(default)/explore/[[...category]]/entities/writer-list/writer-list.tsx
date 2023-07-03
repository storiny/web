import { StoryCategory } from "@storiny/shared";
import React from "react";

import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetExploreWritersQuery } from "~/redux/features";

import WriterListEmptyState from "./empty-state";

const WriterList = ({
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
    useGetExploreWritersQuery({
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
      {loading ? <UserListSkeleton /> : null}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <WriterListEmptyState query={debouncedQuery} />
      ) : (
        <VirtualizedUserList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          users={items}
        />
      )}
    </>
  );
};

export default WriterList;
