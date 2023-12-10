import React from "react";

import CustomState from "~/entities/custom-state";

interface TagEmptyStateProps {
  query: string;
}

const TagEmptyState = ({ query }: TagEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "There are no public stories that feature this tag."
    }
    title={query ? `Could not find any story for "${query}"` : "No stories"}
  />
);

export default TagEmptyState;
