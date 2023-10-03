import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const ModerationMutesRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography
      className={clsx(css["t-medium"], css["t-minor"])}
      level={"body2"}
    >
      About muted accounts
    </Typography>
    <Typography className={css["t-minor"]} level={"body2"}>
      The stories from muted accounts will not appear in your home feed, and you
      will not receive any notifications from them.{" "}
      <Link
        // TODO(future): Get rid of notion
        href={
          "https://storiny.notion.site/Muting-users-8285611765a94503852ab690df0a939d"
        }
        underline={"always"}
      >
        Learn more
      </Link>
    </Typography>
  </React.Fragment>
);

export default ModerationMutesRightSidebarContent;
