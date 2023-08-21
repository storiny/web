import React from "react";

import CustomState from "~/entities/CustomState";
import CommentIcon from "~/icons/Comment";
import EyeOffIcon from "~/icons/EyeOff";

import { StoryResponsesTabValue } from "./client";

interface StoryResponsesEmptyStateProps {
  query: string;
  value: StoryResponsesTabValue;
}

const StoryResponsesEmptyState = ({
  value,
  query
}: StoryResponsesEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : value === "all"
        ? "When people leave comments on this story, they will show up here."
        : "When you hide comments on this story, they will show up here."
    }
    icon={
      query ? undefined : value === "all" ? <CommentIcon /> : <EyeOffIcon />
    }
    title={
      query
        ? `Could not find any response for "${query}"`
        : value === "all"
        ? "No comments"
        : "No hidden comments"
    }
  />
);

export default StoryResponsesEmptyState;
