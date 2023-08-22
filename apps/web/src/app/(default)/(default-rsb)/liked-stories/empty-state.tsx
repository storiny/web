import React from "react";

import CustomState from "~/entities/CustomState";
import StoryHeartIcon from "~/icons/StoryHeart";

interface BookmarksEmptyStateProps {
  query: string;
}

const BookmarksEmptyState = ({
  query
}: BookmarksEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "The stories that receive a like from you will appear here."
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
