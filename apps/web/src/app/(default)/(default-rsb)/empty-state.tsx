import React from "react";

import CustomState from "~/entities/CustomState";

import { IndexTabValue } from "./page";

interface IndexEmptyStateProps {
  value: IndexTabValue;
}

const IndexEmptyState = ({ value }: IndexEmptyStateProps) => (
  <CustomState
    autoSize
    description={
      value === "suggested"
        ? "We were unable to find enough relevant stories to populate your feed. Perhaps you could follow some writers or tags?"
        : "Stories published by your friends and the writers you follow will appear here."
    }
    title={
      value === "suggested"
        ? "It feels a little empty down here"
        : "No content available here yet"
    }
  />
);

export default IndexEmptyState;
