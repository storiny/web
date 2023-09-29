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
  const { storyId } = props;
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_story_preview_query(storyId);

  return isError ? (
    <ErrorState
      auto_size
      component_props={{
        button: { loading: isFetching }
      }}
      retry={refetch}
      type={get_query_error_type(error)}
    />
  ) : !data || isLoading || isFetching ? (
    <StoryCardSkeleton />
  ) : (
    <StoryCard story={data} />
  );
};

export default ContentStoryResponsesRightSidebarContent;
