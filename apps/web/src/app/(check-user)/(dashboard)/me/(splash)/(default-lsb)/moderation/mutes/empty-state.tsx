import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import MuteIcon from "~/icons/mute";

const MutesEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
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
    }
    icon={<MuteIcon />}
    title={"No muted users"}
  />
);

export default MutesEmptyState;
