import React from "react";

import ErrorState from "~/entities/ErrorState";
import StoryCard, { StoryCardSkeleton } from "~/entities/StoryCard";
import { getQueryErrorType, useGetStoryPreviewQuery } from "~/redux/features";

import { StoryResponsesRightSidebarProps } from "./right-sidebar.props";

const ContentStoryResponsesRightSidebarContent = (
  props: StoryResponsesRightSidebarProps
): React.ReactElement => {
  const { storyId } = props;
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStoryPreviewQuery({ storyId });

  return isError ? (
    <ErrorState
      autoSize
      componentProps={{
        button: { loading: isFetching }
      }}
      retry={refetch}
      type={getQueryErrorType(error)}
    />
  ) : !data || isLoading || isFetching ? (
    <StoryCardSkeleton />
  ) : (
    <StoryCard story={data} />
  );
};

export default ContentStoryResponsesRightSidebarContent;
