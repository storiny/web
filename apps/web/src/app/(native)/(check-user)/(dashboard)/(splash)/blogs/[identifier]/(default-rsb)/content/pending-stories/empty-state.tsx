import React from "react";

import CustomState from "~/entities/custom-state";
import StoryIcon from "~/icons/story";

interface PendingStoriesEmptyStateProps {
  query: string;
}

const PendingStoriesEmptyState = ({
  query
}: PendingStoriesEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When members of this blog submit a draft or a published story for review, it will show up here."
    }
    icon={query ? undefined : <StoryIcon />}
    title={
      query ? `Could not find any story for "${query}"` : "No pending stories"
    }
  />
);

export default PendingStoriesEmptyState;
