import React from "react";

import CustomState from "../../../../../../../../../../../../packages/ui/src/entities/custom-state";
import CommentIcon from "~/icons/Comment";
import ReplyIcon from "~/icons/Reply";

import { ResponsesTabValue } from "./client";

interface ResponsesEmptyStateProps {
  query: string;
  value: ResponsesTabValue;
}

const ResponsesEmptyState = ({
  value,
  query
}: ResponsesEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : value === "comments"
        ? "When you leave comments on stories, they will show up here."
        : "When you reply to comments, they will show up here."
    }
    icon={
      query ? undefined : value === "comments" ? <CommentIcon /> : <ReplyIcon />
    }
    title={
      query ? `Could not find any response for "${query}"` : `No ${value} yet`
    }
  />
);

export default ResponsesEmptyState;
