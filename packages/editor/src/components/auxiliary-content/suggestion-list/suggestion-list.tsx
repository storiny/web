"use client";

import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/ErrorState";
import {
  get_query_error_type,
  use_get_story_recommendations_query
} from "~/redux/features";

import { storyMetadataAtom } from "../../../atoms";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const EditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_story_recommendations_query({
      page,
      storyId: story.id
    });
  const { items = [], has_more } = data || {};
  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      {isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState />
      ) : isLoading || (isFetching && page === 1) ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          loadMore={loadMore}
          stories={items}
        />
      )}
    </React.Fragment>
  );
};

export default EditorAuxiliaryContentSuggestionList;
