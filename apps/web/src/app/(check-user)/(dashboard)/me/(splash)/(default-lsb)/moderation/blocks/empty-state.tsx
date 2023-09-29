import React from "react";

import Link from "../../../../../../../../../../../packages/ui/src/components/link";
import CustomState from "../../../../../../../../../../../packages/ui/src/entities/custom-state";
import BanIcon from "../../../../../../../../../../../packages/ui/src/icons/ban";

interface BlocksEmptyStateProps {
  query: string;
}

const BlocksEmptyState = ({
  query
}: BlocksEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query ? (
        "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
      ) : (
        <React.Fragment>
          If you block someone, they will appear here. Blocking someone prevents
          them from following you or reading your stories.{" "}
          <Link href={"/guides/blocked-accounts"} underline={"always"}>
            Learn more
          </Link>
        </React.Fragment>
      )
    }
    icon={query ? undefined : <BanIcon />}
    title={
      query ? `Could not find any user for "${query}"` : "No blocked users"
    }
  />
);

export default BlocksEmptyState;
