import React from "react";

import CustomState from "~/entities/custom-state";
import StoryIcon from "~/icons/story";
import TrashIcon from "~/icons/trash";

import { StoriesTabValue } from "./client";

interface StoriesEmptyStateProps {
  query: string;
  value: StoriesTabValue;
}

const StoriesEmptyState = ({
  value,
  query
}: StoriesEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : value === "deleted"
          ? "You have not deleted any stories recently."
          : "When you publish a story, it will show up here."
    }
    icon={
      query ? undefined : value === "published" ? <StoryIcon /> : <TrashIcon />
    }
    title={
      query
        ? `Could not find any story for "${query}"`
        : `No ${value === "published" ? "published" : "deleted"} stories`
    }
  />
);

export default StoriesEmptyState;
