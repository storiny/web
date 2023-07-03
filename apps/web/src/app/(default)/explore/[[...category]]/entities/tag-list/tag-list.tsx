import { StoryCategory } from "@storiny/shared";
import React from "react";

import { TagListSkeleton, VirtualizedTagList } from "~/common/tag";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetExploreTagsQuery } from "~/redux/features";

import TagListEmptyState from "./empty-state";

const TagList = ({
  category,
  debouncedQuery,
  loading: loadingProp
}: {
  category: StoryCategory | "all";
  debouncedQuery: string;
  loading: boolean;
}): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetExploreTagsQuery({
      page,
      category,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
  const loading = isLoading || loadingProp;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <>
      {loading ? <TagListSkeleton /> : null}
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
        <TagListEmptyState query={debouncedQuery} />
      ) : (
        <VirtualizedTagList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          tags={items}
        />
      )}
    </>
  );
};

export default TagList;
