import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

const ModerationMutesRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography color={"minor"} level={"body2"} weight={"medium"}>
      About muted accounts
    </Typography>
    <Typography color={"minor"} level={"body2"}>
      When you mute someone, their stories will not show up in your home feed,
      and you will not receive any notifications from them.{" "}
      <Link
        href={SUPPORT_ARTICLE_MAP.MUTING_USERS}
        target={"_blank"}
        underline={"always"}
      >
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationMutesRightSidebarContent;
