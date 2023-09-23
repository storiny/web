import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import Skeleton from "~/components/Skeleton";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import tagStyles from "../tag.module.scss";
import { TagSkeletonProps } from "./skeleton.props";

const TagSkeleton = (props: TagSkeletonProps): React.ReactElement => {
  const { virtual } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx("flex-col", tagStyles.tag, virtual && tagStyles.virtual)}
      style={{ cursor: "progress" }}
    >
      <div className={clsx("flex-center", tagStyles.main)}>
        <div className={clsx("flex-center", tagStyles.meta)}>
          <Skeleton
            className={tagStyles.avatar}
            height={isMobile ? 36 : 30}
            shape={"circular"}
            width={isMobile ? 36 : 30}
          />
          <Skeleton height={18} width={142} />
        </div>
        <Grow />
        <Skeleton height={isMobile ? 36 : 30} width={isMobile ? 92 : 80} />
      </div>
      <div className={clsx("flex-center", tagStyles.stats)}>
        <Skeleton height={14} width={64} />
        <Skeleton height={14} width={64} />
        <Grow />
        <Skeleton height={14} width={isMobile ? 48 : 108} />
      </div>
    </div>
  );
};

export default React.memo(TagSkeleton);
