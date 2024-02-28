import React from "react";

import CustomState from "~/entities/custom-state";

interface BlogRequestsEmptyStateProps {
  query: string;
}

const BlogRequestsEmptyState = ({
  query
}: BlogRequestsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When someone sends you a blog invite, it will show up here."
    }
    title={
      query ? `Could not find any request for "${query}"` : "No blog requests"
    }
  />
);

export default BlogRequestsEmptyState;
