import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_user_stories,
  use_get_user_stories_query
} from "~/redux/features";

import { ProfileEntitySortValue } from "../../client";

const EmptyState = dynamic(() => import("../../empty-state"), {
  loading: dynamic_loader()
});

interface Props {
  query: string;
  sort: ProfileEntitySortValue;
  user_id: string;
  username: string;
}

const StoriesTab = (props: Props): React.ReactElement => {
  const { query, sort, user_id, username } = props;
  const debounced_query = use_debounce(query);
  const page = use_pagination(
    select_user_stories({
      page: 1,
      sort,
      user_id,
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
  ] = use_get_user_stories_query();

  const refetch = use_default_fetch(
    trigger,
    {
      page,
      sort,
      user_id,
      query: debounced_query
    },
    [sort, user_id, debounced_query]
  );

  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        sort,
        user_id,
        query: debounced_query
      },
      true
    );
  }, [debounced_query, page, sort, trigger, user_id]);

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
        <EmptyState entity_type={"stories"} query={query} username={username} />
      ) : is_loading || is_typing || (is_fetching && page === 1) ? (
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
