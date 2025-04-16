import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_explore_writers,
  use_get_explore_writers_query
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const WriterList = ({
  category,
  debounced_query,
  loading: loading_prop
}: {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
}): React.ReactElement => {
  const page = use_pagination(
    select_explore_writers({
      page: 1,
      category,
      query: debounced_query
    })
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
  ] = use_get_explore_writers_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      category,
      query: debounced_query
    },
    [category, debounced_query]
  );
  const loading = is_loading || loading_prop;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        category,
        query: debounced_query
      },
      true
    );
  }, [category, debounced_query, page, trigger]);

  return (
    <>
      {loading || (is_fetching && page === 1) ? (
        <UserListSkeleton />
      ) : is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState query={debounced_query} />
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

export default WriterList;
