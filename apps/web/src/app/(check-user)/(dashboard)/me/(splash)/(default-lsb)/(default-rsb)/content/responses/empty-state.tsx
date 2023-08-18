import React from "react";

import CustomState from "~/entities/CustomState";
import CommentIcon from "~/icons/Comment";
import ReplyIcon from "~/icons/Reply";

import { ResponsesTabValue } from "./client";

interface ResponsesEmptyStateProps {
  value: ResponsesTabValue;
}

const ResponsesEmptyState = ({
  value
}: ResponsesEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      value === "comments"
        ? "When you leave comments on stories, they will show up here."
        : "When you reply to comments, they will show up here."
    }
    icon={value === "comments" ? <CommentIcon /> : <ReplyIcon />}
    title={`No ${value} yet`}
  />
);

export default ResponsesEmptyState;
