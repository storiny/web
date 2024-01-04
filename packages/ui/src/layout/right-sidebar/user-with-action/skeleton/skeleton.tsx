"use client";

import React from "react";

import Grow from "~/components/grow";
import Skeleton from "~/components/skeleton";

import styles from "./skeleton.module.scss";

const UserWithActionSkeleton = (): React.ReactElement => (
  <div className={styles.skeleton}>
    <Skeleton height={32} shape={"circular"} width={32} />
    <span className={styles.meta}>
      <Skeleton height={14} width={114} />
      <Skeleton height={12} width={82} />
    </span>
    <Grow />
    <Skeleton
      height={30}
      style={{
        minWidth: "30px"
      }}
      width={30}
    />
  </div>
);

export default UserWithActionSkeleton;
