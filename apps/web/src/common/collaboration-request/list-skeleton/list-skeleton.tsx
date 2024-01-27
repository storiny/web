"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import {
  CollaborationRequestSkeleton,
  CollaborationRequestSkeletonProps
} from "~/entities/collaboration-request";
import css from "~/theme/main.module.scss";

const CollaborationRequestListSkeleton =
  React.memo<CollaborationRequestSkeletonProps>((props) => (
    <div className={clsx(css["flex-col"], styles.list)}>
      {[...Array(10)].map((_, index) => (
        <React.Fragment key={index}>
          <CollaborationRequestSkeleton {...props} />
          <Divider
            className={css["hide-last"]}
            style={{ marginInline: "var(--grid-compensation)" }}
          />
        </React.Fragment>
      ))}
    </div>
  ));

CollaborationRequestListSkeleton.displayName =
  "CollaborationRequestListSkeleton";

export default CollaborationRequestListSkeleton;
