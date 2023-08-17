import React from "react";

import CustomState from "~/entities/CustomState";

import { DraftsTabValue } from "./client";

interface DraftEmptyStateProps {
  value: DraftsTabValue;
}

const DraftsEmptyState = ({
  value
}: DraftEmptyStateProps): React.ReactElement => (
  <CustomState
    autoSize
    description={
      value === "deleted"
        ? "We were unable to find enough relevant stories to populate your feed. Perhaps you could follow some writers or tags?"
        : "Stories published by your friends and the writers you follow will appear here."
    }
    title={
      value === "deleted"
        ? "It feels a little empty down here"
        : "No content available here yet"
    }
  />
);

export default DraftsEmptyState;
