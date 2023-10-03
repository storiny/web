import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import BanIcon from "~/icons/ban";

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
          <Link
            // TODO(future): Get rid of notion
            href={
              "https://storiny.notion.site/Blocking-users-a7e7d4b651ae4a0c807fea4f5ae3a6bc"
            }
            underline={"always"}
          >
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
