import React from "react";

import CustomState from "~/entities/CustomState";
import BookmarksIcon from "~/icons/Bookmarks";

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
        : "This is where you will find the stories you have bookmarked."
    }
    icon={query ? undefined : <BookmarksIcon />}
    title={
      query
        ? `Could not find any story for "${query}"`
        : "Bookmark stories to read them later"
    }
  />
);

export default BookmarksEmptyState;
