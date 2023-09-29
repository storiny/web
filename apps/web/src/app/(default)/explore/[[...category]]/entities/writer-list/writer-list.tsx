import { StoryCategory } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import ErrorState from "../../../../../../../../../packages/ui/src/entities/error-state";
import {
  get_query_error_type,
  useGetExploreWritersQuery
} from "~/redux/features";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const WriterList = ({
  category,
  debounced_query,
  loading: loadingProp
}: {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
}): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetExploreWritersQuery({
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
      {loading || (isFetching && page === 1) ? (
        <UserListSkeleton />
      ) : isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
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
