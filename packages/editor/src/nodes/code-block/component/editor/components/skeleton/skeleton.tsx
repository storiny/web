import { clsx } from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import css from "~/theme/main.module.scss";

import styles from "./skeleton.module.scss";

const CodeBlockSkeleton = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.skeleton)}>
    <Skeleton />
  </div>
);

export default CodeBlockSkeleton;
