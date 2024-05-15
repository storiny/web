import React from "react";

import CustomState from "~/entities/custom-state";
import StoryIcon from "~/icons/story";

interface PublishedStoriesEmptyStateProps {
  query: string;
}

const PublishedStoriesEmptyState = ({
  query
}: PublishedStoriesEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When a story is published in this blog, it will show up here."
    }
    icon={query ? undefined : <StoryIcon />}
    title={
      query ? `Could not find any story for "${query}"` : "No published stories"
    }
  />
);

export default PublishedStoriesEmptyState;
