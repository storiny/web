import React from "react";

import CustomState from "~/entities/custom-state";

import { CollaborationRequestsTabValue } from "./collaboration-requests";

interface CollaborationRequestsEmptyStateProps {
  tab: CollaborationRequestsTabValue;
}

const CollaborationRequestsEmptyState = ({
  tab
}: CollaborationRequestsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      tab === "received"
        ? "When someone sends you a collaboration request, it will show up here."
        : "When you send a collaboration request to someone, it will show up here."
    }
    title={`No requests ${tab}`}
  />
);

export default CollaborationRequestsEmptyState;
