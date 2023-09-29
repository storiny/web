import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../packages/ui/src/hooks/use-debounce";
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
  user_id: string;
  username: string;
}

const StoriesTab = (props: Props): React.ReactElement => {
  const { query, sort, user_id, username } = props;
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_user_stories_query({
      page,
      sort,
      user_id,
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
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState entityType={"stories"} query={query} username={username} />
      ) : isLoading || is_typing || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
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

export default React.memo(StoriesTab);
