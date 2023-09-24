"use client";

import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/ErrorState";
import {
  getQueryErrorType,
  useGetStoryRecommendationsQuery
} from "~/redux/features";

import { storyMetadataAtom } from "../../../atoms";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const EditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStoryRecommendationsQuery({
      page,
      storyId: story.id
    });
  const { items = [], hasMore } = data || {};
  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
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
        <EmptyState />
      ) : isLoading || (isFetching && page === 1) ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          stories={items}
        />
      )}
    </React.Fragment>
  );
};

export default EditorAuxiliaryContentSuggestionList;
