import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import HistoryIcon from "~/icons/history";

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
          Stories you read will show up here. You can disable this in your{" "}
          <Link href={"/me/account/privacy"} underline={"always"}>
            privacy settings.
          </Link>
          .
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
