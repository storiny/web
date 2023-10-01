import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Skeleton from "~/components/skeleton";
import css from "~/theme/main.module.scss";

import card_styles from "../story-card.module.scss";

const EditorStoryCardSkeleton = (): React.ReactElement => (
  <div aria-busy={"true"} className={clsx(card_styles["story-card"])}>
    <AspectRatio
      className={clsx(css["full-w"], card_styles.splash)}
      ratio={1.76}
    >
      <Skeleton no_radius />
    </AspectRatio>
    <div className={clsx(css["flex-center"], card_styles.meta)}>
      <Skeleton height={24} style={{ width: "100%" }} />
    </div>
  </div>
);

export default EditorStoryCardSkeleton;
