import React from "react";

import CustomState from "~/entities/CustomState";
import StoryIcon from "~/icons/Story";
import TrashIcon from "~/icons/Trash";

import { StoriesTabValue } from "./client";

interface StoriesEmptyStateProps {
  value: StoriesTabValue;
}

const StoriesEmptyState = ({
  value
}: StoriesEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      value === "deleted"
        ? "You have not deleted any stories recently."
        : "When you publish a story, it will show up here."
    }
    icon={value === "published" ? <StoryIcon /> : <TrashIcon />}
    title={`No ${value === "published" ? "published" : "deleted"} stories`}
  />
);

export default StoriesEmptyState;
