import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Skeleton from "~/components/Skeleton";
import Spacer from "~/components/Spacer";
import { StoryCardSkeletonProps } from "~/entities/StoryCard/Skeleton/Skeleton.props";

import cardStyles from "../StoryCard.module.scss";

const StoryCardSkeleton = (
  props: StoryCardSkeletonProps
): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      aria-busy={"true"}
      className={clsx(cardStyles["story-card"], className)}
    >
      <AspectRatio className={clsx("full-w", cardStyles.splash)} ratio={1.76}>
        <Skeleton />
      </AspectRatio>
      <div className={clsx("flex-col", cardStyles.meta)}>
        <Skeleton height={16} width={214} />
        <Spacer orientation={"vertical"} size={0.5} />
        <Skeleton height={12} width={96} />
        <Skeleton height={12} width={48} />
        <Skeleton height={12} width={84} />
        <footer className={clsx("flex", cardStyles.footer)}>
          <Skeleton height={14} width={48} />
          <Skeleton height={14} width={26} />
          <Skeleton height={14} width={56} />
        </footer>
      </div>
    </div>
  );
};

export default StoryCardSkeleton;
