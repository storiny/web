import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import {
  get_query_error_type,
  GetUserEntityType,
  use_get_user_entities_query
} from "~/redux/features";

import { ProfileEntitySortValue } from "../../client";

const EmptyState = dynamic(() => import("../../empty-state"), {
  loading: dynamic_loader()
});

interface Props {
  entity_type: GetUserEntityType;
  query: string;
  sort: ProfileEntitySortValue;
  user_id: string;
  username: string;
}

const EntitiesTab = (props: Props): React.ReactElement => {
  const { query, sort, user_id, username, entity_type } = props;
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state<typeof page>(1, set_page);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_user_entities_query({
    page,
    sort,
    user_id,
    entity_type,
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
        <EmptyState
          entity_type={entity_type}
          query={query}
          username={username}
        />
      ) : is_loading || is_typing || (is_fetching && page === 1) ? (
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
