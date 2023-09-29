import clsx from "clsx";
import React from "react";

import Grow from "../../../../../ui/src/components/grow";
import Skeleton from "../../../../../ui/src/components/skeleton";

import styles from "./layer.module.scss";

const LayerSkeleton = (): React.ReactElement => (
  <div
    aria-busy={"true"}
    className={clsx("flex-center", styles.x, styles.layer)}
  >
    <span className={clsx("flex-center", styles.x, styles.icon)}>
      <Skeleton height={14} width={14} />
    </span>
    <Skeleton height={8} width={48} />
    <Grow />
  </div>
);

export default LayerSkeleton;
