import React from "react";

import CustomState from "../../../../../../../../../packages/ui/src/entities/custom-state";

interface WriterListEmptyStateProps {
  query: string;
}

const TagListEmptyState = ({
  query
}: WriterListEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "Looks like we'll just have to use our imaginations for now."
    }
    title={
      query
        ? `Could not find any tag for "${query}"`
        : "No content is available here yet"
    }
  />
);

export default TagListEmptyState;
