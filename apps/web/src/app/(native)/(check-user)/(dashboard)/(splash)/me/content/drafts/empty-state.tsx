import React from "react";

import CustomState from "~/entities/custom-state";
import StoryIcon from "~/icons/story";
import TrashIcon from "~/icons/trash";

import { DraftsTabValue } from "./client";

interface DraftsEmptyStateProps {
  query: string;
  value: DraftsTabValue;
}

const DraftsEmptyState = ({
  value,
  query
}: DraftsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : value === "deleted"
          ? "You have not deleted any drafts recently."
          : "When you create a draft, unpublish a story, or restore a story, it will show up here."
    }
    icon={
      query ? undefined : value === "pending" ? <StoryIcon /> : <TrashIcon />
    }
    title={
      query
        ? `Could not find any draft for "${query}"`
        : `No ${value === "pending" ? "pending" : "deleted"} drafts`
    }
  />
);

export default DraftsEmptyState;
