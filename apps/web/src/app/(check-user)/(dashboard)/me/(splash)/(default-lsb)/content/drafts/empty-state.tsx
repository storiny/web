import React from "react";

import CustomState from "~/entities/CustomState";
import StoryIcon from "~/icons/Story";
import TrashIcon from "~/icons/Trash";

import { DraftsTabValue } from "./client";

interface DraftsEmptyStateProps {
  value: DraftsTabValue;
}

const DraftsEmptyState = ({
  value
}: DraftsEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      value === "deleted"
        ? "You have not deleted any drafts recently."
        : "When you create a draft, unpublish a story, or restore a story, it will show up here."
    }
    icon={value === "pending" ? <StoryIcon /> : <TrashIcon />}
    title={`No ${value === "pending" ? "pending" : "deleted"} drafts`}
  />
);

export default DraftsEmptyState;
