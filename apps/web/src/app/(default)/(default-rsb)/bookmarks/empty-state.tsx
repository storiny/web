import React from "react";

import CustomState from "~/entities/custom-state";
import BookmarksIcon from "~/icons/bookmarks";

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
        : "Bookmark stories to read them later."
    }
    icon={query ? undefined : <BookmarksIcon />}
    title={query ? `Could not find any story for "${query}"` : "No bookmarks"}
  />
);

export default BookmarksEmptyState;
