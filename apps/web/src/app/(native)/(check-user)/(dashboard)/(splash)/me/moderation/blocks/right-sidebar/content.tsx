import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

const ModerationBlocksRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography color={"minor"} level={"body2"} weight={"medium"}>
      About blocked accounts
    </Typography>
    <Typography color={"minor"} level={"body2"}>
      When you block someone, they are prevented from following you or reacting
      to your stories, and their content will not appear in your home feed or
      search results.
      <br />
      <br />
      However, they may still be able to access your profile and stories through
      a different account or if they are not logged into Storiny.{" "}
      <Link
        href={SUPPORT_ARTICLE_MAP.BLOCKING_USERS}
        target={"_blank"}
        underline={"always"}
      >
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationBlocksRightSidebarContent;
