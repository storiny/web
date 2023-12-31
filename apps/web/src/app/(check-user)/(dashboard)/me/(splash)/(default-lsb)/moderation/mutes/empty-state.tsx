import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import MuteIcon from "~/icons/mute";

const MutesEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
      <React.Fragment>
        When you mute someone, they will show up here.{" "}
        <Link
          href={SUPPORT_ARTICLE_MAP.MUTING_USERS}
          target={"_blank"}
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
