import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const ModerationBlocksRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography
      className={clsx(css["t-medium"], css["t-minor"])}
      level={"body2"}
    >
      About blocked accounts
    </Typography>
    <Typography className={css["t-minor"]} level={"body2"}>
      When you block someone, they are prevented from following you or reacting
      to your stories, and their content will not appear in your home feed or
      search results.
      <br />
      <br />
      However, they may still be able to access your profile and stories through
      a different account or if they are not logged into Storiny.{" "}
      <Link
        // TODO(future): Get rid of notion
        href={
          "https://storiny.notion.site/Blocking-users-a7e7d4b651ae4a0c807fea4f5ae3a6bc"
        }
        underline={"always"}
      >
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationBlocksRightSidebarContent;
