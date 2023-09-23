import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import Skeleton from "~/components/Skeleton";
import { UserSkeletonProps } from "~/entities/user/skeleton/skeleton.props";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import styles from "../user.module.scss";

const UserSkeleton = (props: UserSkeletonProps): React.ReactElement => {
  const { virtual } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx("flex-col", styles.user, virtual && styles.virtual)}
      style={{ cursor: "progress" }}
    >
      <div className={clsx("flex", styles.main)}>
        <div className={clsx("flex", styles.meta)}>
          <Skeleton height={48} shape={"circular"} width={48} />
          <div className={"flex-col"} style={{ gap: "8px" }}>
            <Skeleton height={18} width={142} />
            {isMobile ? (
              <Skeleton height={14} width={88} />
            ) : (
              <div className={clsx("flex", styles.stats)}>
                <Skeleton height={14} width={48} />
                <Skeleton height={14} width={48} />
              </div>
            )}
          </div>
        </div>
        <Grow />
        <div className={clsx("flex", styles.actions)}>
          <Skeleton height={isMobile ? 36 : 30} width={84} />
          {!isMobile && <Skeleton height={30} width={30} />}
        </div>
      </div>
      <div
        className={clsx("flex-col", styles.bio)}
        style={{ paddingTop: "8px" }}
      >
        <Skeleton height={14} width={isMobile ? 312 : 250} />
        <Skeleton height={14} width={isMobile ? 178 : 192} />
      </div>
    </div>
  );
};

export default React.memo(UserSkeleton);
