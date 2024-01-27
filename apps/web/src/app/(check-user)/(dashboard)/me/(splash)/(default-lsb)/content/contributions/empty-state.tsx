import React from "react";

import CustomState from "~/entities/custom-state";
import ContributionIcon from "~/icons/contribution";

interface ContributionsEmptyStateProps {
  query: string;
}

const ContributionsEmptyState = ({
  query
}: ContributionsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : "When someone invites you to view or contribute to their stories, they will show up here."
    }
    icon={query ? undefined : <ContributionIcon />}
    title={
      query
        ? `Could not find any contribution for "${query}"`
        : "No contributions"
    }
  />
);

export default ContributionsEmptyState;
