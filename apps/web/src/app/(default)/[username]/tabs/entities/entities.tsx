import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import {
  get_query_error_type,
  GetUserEntityType,
  use_get_user_entities_query
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
    use_get_user_entities_query({
      page,
      sort,
      userId,
      entityType,
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
        <EmptyState entityType={entityType} query={query} username={username} />
      ) : isLoading || isTyping || (isFetching && page === 1) ? (
        <UserListSkeleton />
      ) : (
        <VirtualizedUserList
          has_more={Boolean(has_more)}
          loadMore={loadMore}
          users={items}
        />
      )}
    </>
  );
};

export default React.memo(EntitiesTab);
