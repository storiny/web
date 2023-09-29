"use client";

import clsx from "clsx";
import React from "react";

import Grow from "src/components/grow";
import Skeleton from "src/components/skeleton";

import styles from "./skeleton.module.scss";

const UserWithActionSkeleton = (): React.ReactElement => (
  <div className={clsx(styles.skeleton)}>
    <Skeleton height={32} shape={"circular"} width={32} />
    <span className={styles.meta}>
      <Skeleton height={14} width={114} />
      <Skeleton height={12} width={82} />
    </span>
    <Grow />
    <Skeleton height={30} width={30} />
  </div>
);

export default UserWithActionSkeleton;
