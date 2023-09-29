import { clsx } from "clsx";
import React from "react";

import Link from "../../../../../../../../../../../../packages/ui/src/components/link";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";

const ModerationMutesRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      About muted accounts
    </Typography>
    <Typography className={"t-minor"} level={"body2"}>
      The stories from muted accounts will not appear in your home feed, and you
      will not receive any notifications from them.{" "}
      <Link href={"/guides/muted-accounts"} underline={"always"}>
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationMutesRightSidebarContent;
