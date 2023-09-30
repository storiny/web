import React from "react";

import ErrorState from "../../../../../../../../../../../../../../packages/ui/src/entities/error-state";
import StoryCard, {
  StoryCardSkeleton
} from "../../../../../../../../../../../../../../packages/ui/src/entities/story-card";
import {
  get_query_error_type,
  use_get_story_preview_query
} from "~/redux/features";

import { StoryResponsesRightSidebarProps } from "./right-sidebar.props";

const ContentStoryResponsesRightSidebarContent = (
  props: StoryResponsesRightSidebarProps
): React.ReactElement => {
  const { story_id } = props;
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_preview_query(story_id);

  return is_error ? (
    <ErrorState
      auto_size
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      type={get_query_error_type(error)}
    />
  ) : !data || is_loading || is_fetching ? (
    <StoryCardSkeleton />
  ) : (
    <StoryCard story={data} />
  );
};

export default ContentStoryResponsesRightSidebarContent;
