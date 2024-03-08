import React from "react";

import CustomState from "~/entities/custom-state";

interface EditorRequestsEmptyStateProps {
  query: string;
}

const EditorRequestsEmptyState = ({
  query
}: EditorRequestsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When someone sends you a friend request, it will show up here."
    }
    title={
      query ? `Could not find any request for "${query}"` : "No editor requests"
    }
  />
);

export default EditorRequestsEmptyState;
