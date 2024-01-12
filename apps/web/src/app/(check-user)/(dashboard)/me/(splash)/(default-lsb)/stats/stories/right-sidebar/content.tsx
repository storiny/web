import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import StoryCard, { StoryCardSkeleton } from "~/entities/story-card";
import { get_query_error_type } from "~/redux/features";
import css from "~/theme/main.module.scss";

import SuspendedDashboardRightSidebarContent from "../../../(default-rsb)/right-sidebar/content";
import { StoriesMetricsRightSidebarProps } from "./right-sidebar.props";

const StoriesMetricsRightSidebarContent = ({
  hook_return
}: StoriesMetricsRightSidebarProps): React.ReactElement => {
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
  ) : data && !data.latest_story ? (
    <SuspendedDashboardRightSidebarContent />
  ) : (
    <React.Fragment>
      <Typography
        className={clsx(css["t-medium"], css["t-minor"])}
        level={"body2"}
      >
        Latest story
      </Typography>
      {!data || is_loading || is_fetching ? (
        <StoryCardSkeleton />
      ) : (
        <StoryCard story={data.latest_story} />
      )}
    </React.Fragment>
  );
};

export default StoriesMetricsRightSidebarContent;
