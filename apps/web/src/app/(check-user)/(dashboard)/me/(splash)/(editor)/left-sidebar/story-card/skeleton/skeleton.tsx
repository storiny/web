import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Skeleton from "~/components/Skeleton";

import cardStyles from "../story-card.module.scss";

const EditorStoryCardSkeleton = (): React.ReactElement => (
  <div aria-busy={"true"} className={clsx(cardStyles["story-card"])}>
    <AspectRatio className={clsx("full-w", cardStyles.splash)} ratio={1.76}>
      <Skeleton noRadius />
    </AspectRatio>
    <div className={clsx("flex-center", cardStyles.meta)}>
      <Skeleton height={24} style={{ width: "100%" }} />
    </div>
  </div>
);

export default EditorStoryCardSkeleton;
