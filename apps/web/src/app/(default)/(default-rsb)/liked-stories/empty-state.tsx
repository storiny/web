import React from "react";

import CustomState from "~/entities/custom-state";
import StoryHeartIcon from "~/icons/story-heart";

interface BookmarksEmptyStateProps {
  query: string;
}

const BookmarksEmptyState = ({
  query
}: BookmarksEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When you like stories, they will show up here."
    }
    icon={query ? undefined : <StoryHeartIcon />}
    title={
      query
        ? `Could not find any story for "${query}"`
        : "You haven’t liked any stories yet"
    }
  />
);

export default BookmarksEmptyState;
