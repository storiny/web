import clsx from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Skeleton from "~/components/skeleton";
import css from "~/theme/main.module.scss";

import styles from "./layer.module.scss";

const LayerSkeleton = (): React.ReactElement => (
  <div aria-busy={"true"} className={clsx(css["flex-center"], styles.layer)}>
    <span className={clsx(css["flex-center"], styles.icon)}>
      <Skeleton height={14} width={14} />
    </span>
    <Skeleton height={8} width={48} />
    <Grow />
  </div>
);

export default LayerSkeleton;
