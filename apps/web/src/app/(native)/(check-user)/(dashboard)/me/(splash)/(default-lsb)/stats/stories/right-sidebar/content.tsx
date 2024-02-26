import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import StoryCard, { StoryCardSkeleton } from "~/entities/story-card";
import {
  get_query_error_type,
  use_get_story_preview_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import SuspendedDashboardRightSidebarContent from "../../../(default-rsb)/right-sidebar/content";
import { StoriesStatsRightSidebarProps } from "./right-sidebar.props";

const LatestStoryPreview = ({
  story_id
}: {
  story_id: string;
}): React.ReactElement => {
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
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      size={"sm"}
      type={get_query_error_type(error)}
    />
  ) : !data || is_loading || is_fetching ? (
    <StoryCardSkeleton />
  ) : (
    <StoryCard story={data} />
  );
};

const StoriesStatsRightSidebarContent = ({
  hook_return
}: StoriesStatsRightSidebarProps): React.ReactElement => {
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = hook_return;

  return is_error ? (
    <ErrorState
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      size={"sm"}
      type={get_query_error_type(error)}
    />
  ) : data && data.latest_story_id === null ? (
    <SuspendedDashboardRightSidebarContent />
  ) : (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Latest story
      </Typography>
      {!data || is_loading || is_fetching ? (
        <StoryCardSkeleton />
      ) : (
        <LatestStoryPreview story_id={data.latest_story_id} />
      )}
    </React.Fragment>
  );
};

export default StoriesStatsRightSidebarContent;
