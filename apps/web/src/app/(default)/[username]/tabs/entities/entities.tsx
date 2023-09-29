import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../packages/ui/src/hooks/use-debounce";
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
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_user_entities_query({
      page,
      sort,
      userId,
      entityType,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <>
      {isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState entityType={entityType} query={query} username={username} />
      ) : isLoading || is_typing || (isFetching && page === 1) ? (
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

export default React.memo(EntitiesTab);
