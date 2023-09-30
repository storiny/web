import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";

import card_styles from "../story-card.module.scss";
import { StoryCardSkeletonProps } from "./skeleton.props";

const StoryCardSkeleton = (
  props: StoryCardSkeletonProps
): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      aria-busy={"true"}
      className={clsx(card_styles["story-card"], className)}
    >
      <AspectRatio className={clsx("full-w", card_styles.splash)} ratio={1.76}>
        <Skeleton no_radius />
      </AspectRatio>
      <div className={clsx("flex-col", card_styles.meta)}>
        <Skeleton height={16} width={214} />
        <Spacer orientation={"vertical"} size={0.5} />
        <Skeleton height={12} width={96} />
        <Skeleton height={12} width={48} />
        <Skeleton height={12} width={84} />
        <footer className={clsx("flex", card_styles.footer)}>
          <Skeleton height={14} width={48} />
          <Skeleton height={14} width={26} />
          <Skeleton height={14} width={56} />
        </footer>
      </div>
    </div>
  );
};

export default StoryCardSkeleton;
