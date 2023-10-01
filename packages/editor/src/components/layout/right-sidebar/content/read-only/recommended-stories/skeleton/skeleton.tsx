"use client";

import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import css from "~/theme/main.module.scss";

import styles from "./skeleton.module.scss";

const RecommendedStorySkeleton = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.skeleton)}>
    <Skeleton height={16} />
    <span className={styles.persona}>
      <Skeleton height={24} shape={"circular"} width={24} />
      <Skeleton height={14} width={92} />
    </span>
  </div>
);

export default RecommendedStorySkeleton;
