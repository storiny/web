import React from "react";

import CustomState from "~/entities/CustomState";
import BookmarksIcon from "~/icons/Bookmarks";

interface BookmarksEmptyStateProps {
  query: string;
}

const BookmarksEmptyState = ({ query }: BookmarksEmptyStateProps) => (
  <CustomState
    autoSize
    description={
      Boolean(query)
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "This is where you will find the stories you have bookmarked."
    }
    icon={Boolean(query) ? undefined : <BookmarksIcon />}
    title={
      Boolean(query)
        ? `Could not find any story for "${query}"`
        : "Bookmark stories to read them later"
    }
  />
);

export default BookmarksEmptyState;
