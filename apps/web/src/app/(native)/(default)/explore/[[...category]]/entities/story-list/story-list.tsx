import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/error-state";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import {
  get_query_error_type,
  use_get_explore_stories_query
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const StoryList = ({
  category,
  debounced_query,
  loading: loading_prop
}: {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
}): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_explore_stories_query({
    page,
    category,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const loading = is_loading || loading_prop;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <>
      {loading || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
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
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
        />
      )}
    </>
  );
};

export default StoryList;
