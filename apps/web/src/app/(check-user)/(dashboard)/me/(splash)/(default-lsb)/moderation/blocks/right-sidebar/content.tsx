import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import Typography from "~/components/Typography";

const ModerationBlocksRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      About blocked accounts
    </Typography>
    <Typography className={"t-minor"} level={"body2"}>
      When you block a user, they are prevented from following you or reacting
      to your stories, and their content will not appear in your home feed or
      search results.
      <br />
      <br />
      However, please note that they may still be able to access your profile
      and stories through a different account or if they are not logged into
      Storiny.{" "}
      <Link href={"/guides/blocked-accounts"} underline={"always"}>
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationBlocksRightSidebarContent;
