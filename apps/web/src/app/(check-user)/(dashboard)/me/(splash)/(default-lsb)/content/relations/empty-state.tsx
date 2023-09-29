import React from "react";

import CustomState from "../../../../../../../../../../../packages/ui/src/entities/custom-state";
import UsersIcon from "../../../../../../../../../../../packages/ui/src/icons/users";

import { RelationsTabValue } from "./client";

interface RelationsEmptyStateProps {
  query: string;
  value: RelationsTabValue;
}

const messageMap: Record<RelationsTabValue, string> = {
  followers: "When people start following you, they will show up here.",
  following: "When you start following people, they will show up here.",
  friends: "When you add friends, they will show up here."
};

const RelationsEmptyState = ({
  value,
  query
}: RelationsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : messageMap[value]
    }
    icon={query ? undefined : <UsersIcon />}
    title={
      query
        ? `Could not find any user for "${query}"`
        : value === "following"
        ? "You are not following anyone"
        : `No ${value} yet`
    }
  />
);

export default RelationsEmptyState;
