"use client";

import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/Skeleton";

import styles from "./Skeleton.module.scss";

const PopularStorySkeleton = () => (
  <div className={clsx("flex-col", styles.skeleton)}>
    <Skeleton height={16} />
    <span className={styles.persona}>
      <Skeleton height={24} shape={"circular"} width={24} />
      <Skeleton height={14} width={92} />
    </span>
  </div>
);

export default PopularStorySkeleton;
