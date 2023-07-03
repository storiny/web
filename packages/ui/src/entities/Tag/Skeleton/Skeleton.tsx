import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import Skeleton from "~/components/Skeleton";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import styles from "../Tag.module.scss";

const TagSkeleton = (): React.ReactElement => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  return (
    <div
      aria-busy={"true"}
      className={clsx("flex-col", styles.tag)}
      style={{ cursor: "progress" }}
    >
      <div className={clsx("flex-center", styles.main)}>
        <div className={clsx("flex-center", styles.meta)}>
          <Skeleton
            className={styles.avatar}
            height={isMobile ? 36 : 30}
            shape={"circular"}
            width={isMobile ? 36 : 30}
          />
          <Skeleton height={18} width={142} />
        </div>
        <Grow />
        <Skeleton height={isMobile ? 36 : 30} width={isMobile ? 92 : 80} />
      </div>
      <div className={clsx("flex-center", styles.stats)}>
        <Skeleton height={14} width={64} />
        <Skeleton height={14} width={64} />
        <Grow />
        <Skeleton height={14} width={isMobile ? 48 : 108} />
      </div>
    </div>
  );
};

export default React.memo(TagSkeleton);
