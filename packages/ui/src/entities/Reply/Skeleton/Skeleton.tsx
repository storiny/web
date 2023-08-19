import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import NoSsr from "~/components/NoSsr";
import Skeleton from "~/components/Skeleton";
import Spacer from "~/components/Spacer";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import replyStyles from "../Reply.module.scss";

const ReplySkeleton = (): React.ReactElement => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  return (
    <NoSsr>
      <div aria-busy={"true"} className={clsx("flex-col", replyStyles.reply)}>
        <div className={clsx("flex")} style={{ alignItems: "center" }}>
          <Skeleton height={32} shape={"circular"} width={32} />
          <Spacer size={1.25} />
          <Skeleton height={18} width={114} />
        </div>
        <div
          className={clsx("flex-col", replyStyles.content)}
          style={{ gap: "6px" }}
        >
          <Skeleton height={10} width={236} />
          <Skeleton height={10} width={140} />
          <Skeleton height={10} width={200} />
        </div>
        <div className={clsx("flex-center")}>
          <Grow />
          <Skeleton height={isMobile ? 18 : 14} width={isMobile ? 52 : 48} />
        </div>
      </div>
    </NoSsr>
  );
};

export default React.memo(ReplySkeleton);
