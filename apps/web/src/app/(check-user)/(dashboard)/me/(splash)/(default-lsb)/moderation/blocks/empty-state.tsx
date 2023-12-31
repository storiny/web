import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
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
          href={SUPPORT_ARTICLE_MAP.BLOCKING_USERS}
          target={"_blank"}
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
