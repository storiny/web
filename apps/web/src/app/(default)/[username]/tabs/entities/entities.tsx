import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import {
  getQueryErrorType,
  GetUserEntityType,
  useGetUserEntitiesQuery
} from "~/redux/features";

import { ProfileEntitySortValue } from "../../client";

const EmptyState = dynamic(() => import("../../empty-state"), {
  loading: dynamicLoader()
});

interface Props {
  entityType: GetUserEntityType;
  query: string;
  sort: ProfileEntitySortValue;
  userId: string;
  username: string;
}

const EntitiesTab = (props: Props): React.ReactElement => {
  const { query, sort, userId, username, entityType } = props;
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetUserEntitiesQuery({
      page,
      sort,
      userId,
      entityType,
      query: debouncedQuery
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
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState entityType={entityType} query={query} username={username} />
      ) : isLoading || isTyping ? (
        <UserListSkeleton />
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

export default React.memo(EntitiesTab);
