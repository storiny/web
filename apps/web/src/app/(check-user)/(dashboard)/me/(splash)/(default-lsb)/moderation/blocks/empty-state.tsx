import React from "react";

import Link from "~/components/link";
import CustomState from "~/entities/custom-state";
import BanIcon from "~/icons/ban";

const BlocksEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
      <React.Fragment>
        When you block someone, they will show up here. Blocking someone
        prevents them from following you or reading your stories.{" "}
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
    }
    icon={<BanIcon />}
    title={"No blocked users"}
  />
);

export default BlocksEmptyState;
