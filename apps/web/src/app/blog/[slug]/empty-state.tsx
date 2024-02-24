import React from "react";

import CustomState from "~/entities/custom-state";

const BlogIndexEmptyState = ({
  query
}: {
  query: string;
}): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "This blog does not feature any content."
    }
    title={
      query
        ? `Could not find any story for "${query}"`
        : "It feels a little empty down here"
    }
  />
);

export default BlogIndexEmptyState;
