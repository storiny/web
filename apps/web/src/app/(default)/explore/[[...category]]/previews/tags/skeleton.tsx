import { clsx } from "clsx";
import React from "react";

import Skeleton from "~/components/Skeleton";

import styles from "./tags.module.scss";

const TagSkeleton = (): React.ReactElement => (
  <Skeleton
    className={clsx(styles.x, styles.skeleton)}
    height={27}
    width={148}
  />
);

export default TagSkeleton;
