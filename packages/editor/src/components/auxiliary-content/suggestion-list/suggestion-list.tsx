"use client";

import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import ErrorState from "~/entities/error-state";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import {
  get_query_error_type,
  use_get_blog_story_recommendations_query,
  use_get_story_recommendations_query
} from "~/redux/features";

import { story_metadata_atom } from "../../../atoms";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const BlogEditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const blog = use_blog_context();
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state<typeof page>(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_story_recommendations_query({
    page,
    story_id: story.id,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};
  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
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
        <EmptyState />
      ) : is_loading || (is_fetching && page === 1) ? (
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

const DefaultEditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state<typeof page>(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_recommendations_query({
    page,
    story_id: story.id
  });
  const { items = [], has_more } = data || {};
  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
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
        <EmptyState />
      ) : is_loading || (is_fetching && page === 1) ? (
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

const EditorAuxiliaryContentSuggestionList = (): React.ReactElement => {
  const blog = use_blog_context();

  return blog?.id ? (
    <BlogEditorAuxiliaryContentSuggestionList />
  ) : (
    <DefaultEditorAuxiliaryContentSuggestionList />
  );
};

export default EditorAuxiliaryContentSuggestionList;
