import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "../../../../../../../../../packages/ui/src/entities/error-state";
import {
  get_query_error_type,
  use_get_explore_stories_query
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const StoryList = ({
  category,
  debounced_query,
  loading: loadingProp
}: {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
}): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_explore_stories_query({
      page,
      category,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const loading = isLoading || loadingProp;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <>
      {loading || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
      ) : isError ? (
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
