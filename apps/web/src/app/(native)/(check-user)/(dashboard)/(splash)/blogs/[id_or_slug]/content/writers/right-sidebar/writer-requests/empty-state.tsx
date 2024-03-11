import React from "react";

import CustomState from "~/entities/custom-state";

interface WriterRequestsEmptyStateProps {
  query: string;
}

const WriterRequestsEmptyState = ({
  query
}: WriterRequestsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When you or an editor sends someone a writer request, it will show up here."
    }
    title={
      query ? `Could not find any request for "${query}"` : "No writer requests"
    }
  />
);

export default WriterRequestsEmptyState;
