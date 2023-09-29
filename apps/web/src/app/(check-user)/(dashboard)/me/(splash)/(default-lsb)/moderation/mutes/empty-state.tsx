import React from "react";

import Link from "../../../../../../../../../../../packages/ui/src/components/link";
import CustomState from "../../../../../../../../../../../packages/ui/src/entities/custom-state";
import MuteIcon from "~/icons/Mute";

interface MutesEmptyStateProps {
  query: string;
}

const MutesEmptyState = ({
  query
}: MutesEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query ? (
        "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
      ) : (
        <React.Fragment>
          If you mute someone, they will appear here.{" "}
          <Link href={"/guides/muted-accounts"} underline={"always"}>
            Learn more
          </Link>
        </React.Fragment>
      )
    }
    icon={query ? undefined : <MuteIcon />}
    title={query ? `Could not find any user for "${query}"` : "No muted users"}
  />
);

export default MutesEmptyState;
