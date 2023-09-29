"use client";

import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "../../../../../ui/src/entities/error-state";
import {
  get_query_error_type,
  use_get_story_recommendations_query
} from "~/redux/features";

import { storyMetadataAtom } from "../../../atoms";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const EditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const story = use_atom_value(storyMetadataAtom);
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_story_recommendations_query({
      page,
      storyId: story.id
    });
  const { items = [], has_more } = data || {};
  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      {isError ? (
        <ErrorState
          auto_size
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
          load_more={load_more}
          stories={items}
        />
      )}
    </React.Fragment>
  );
};

export default EditorAuxiliaryContentSuggestionList;
