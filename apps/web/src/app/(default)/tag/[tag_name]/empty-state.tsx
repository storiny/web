import React from "react";

import CustomState from "~/entities/custom-state";

interface TagEmptyStateProps {
  query: string;
}

const TagEmptyState = ({ query }: TagEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
    }
    title={`Could not find any story for "${query}"`}
  />
);

export default TagEmptyState;
