import React from "react";

import CustomState from "~/entities/CustomState";
import TagsIcon from "~/icons/Tags";

interface TagsEmptyStateProps {
  query: string;
}

const TagsEmptyState = ({ query }: TagsEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When you follow tags, they will show up here."
    }
    icon={query ? undefined : <TagsIcon />}
    title={query ? `Could not find any tag for "${query}"` : "No tags followed"}
  />
);

export default TagsEmptyState;
