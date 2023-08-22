import clsx from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Grow from "~/components/Grow";
import NoSsr from "~/components/NoSsr";
import Skeleton from "~/components/Skeleton";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import commentStyles from "../Comment.module.scss";
import { CommentSkeletonProps } from "./Skeleton.props";

const CommentSkeleton = (props: CommentSkeletonProps): React.ReactElement => {
  const { isExtended } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return (
    <NoSsr>
      <div
        aria-busy={"true"}
        className={clsx("flex-col", commentStyles.comment)}
      >
        <div
          className={clsx("flex", commentStyles["story-persona"])}
          style={{ alignItems: "center" }}
        >
          {isExtended ? (
            <AspectRatio
              className={commentStyles["story-splash"]}
              ratio={1.77}
              tabIndex={-1}
            >
              <Skeleton noRadius />
            </AspectRatio>
          ) : (
            <Skeleton height={32} shape={"circular"} width={32} />
          )}
          <Skeleton height={18} width={114} />
        </div>
        <div className={"flex-col"} style={{ gap: "6px" }}>
          <Skeleton height={10} width={236} />
          <Skeleton height={10} width={140} />
          <Skeleton height={10} width={200} />
        </div>
        <div className={clsx("flex-center")}>
          <Skeleton
            height={isMobile || isExtended ? 18 : 14}
            width={isMobile || isExtended ? 52 : 48}
          />
          <Grow />
          <Skeleton height={isMobile || isExtended ? 18 : 14} width={60} />
        </div>
      </div>
    </NoSsr>
  );
};

export default React.memo(CommentSkeleton);
