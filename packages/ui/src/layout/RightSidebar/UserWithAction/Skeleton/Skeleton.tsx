"use client";

import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import Skeleton from "~/components/Skeleton";

import styles from "./Skeleton.module.scss";

const UserWithActionSkeleton = () => (
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
