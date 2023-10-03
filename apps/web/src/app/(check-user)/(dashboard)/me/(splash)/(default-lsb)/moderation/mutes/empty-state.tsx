import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import MuteIcon from "~/icons/mute";

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
          <Link
            // TODO(future): Get rid of notion
            href={
              "https://storiny.notion.site/Muting-users-8285611765a94503852ab690df0a939d"
            }
            underline={"always"}
          >
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
