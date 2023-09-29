import React from "react";

import Link from "../../../../../../../packages/ui/src/components/link";
import CustomState from "../../../../../../../packages/ui/src/entities/custom-state";
import HistoryIcon from "../../../../../../../packages/ui/src/icons/history";

interface HistoryEmptyStateProps {
  query: string;
}

const HistoryEmptyState = ({
  query
}: HistoryEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query ? (
        "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
      ) : (
        <>
          All the stories you read will appear here, unless you{" "}
          <Link href={"/me/privacy"} underline={"always"}>
            disable reading history
          </Link>{" "}
          in the settings.
        </>
      )
    }
    icon={query ? undefined : <HistoryIcon />}
    title={
      query
        ? `Could not find any story for "${query}"`
        : "Your reading history is empty"
    }
  />
);

export default HistoryEmptyState;
