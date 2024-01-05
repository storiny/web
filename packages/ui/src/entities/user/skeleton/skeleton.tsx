import clsx from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Skeleton from "~/components/skeleton";
import { UserSkeletonProps } from "~/entities/user/skeleton/skeleton.props";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "../user.module.scss";

const UserSkeleton = (props: UserSkeletonProps): React.ReactElement => {
  const { virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx(css["flex-col"], styles.user, virtual && styles.virtual)}
      style={{ cursor: "progress" }}
    >
      <div className={clsx(css["flex"], styles.main)}>
        <div className={clsx(css["flex"], styles.meta)}>
          <Skeleton height={48} shape={"circular"} width={48} />
          <div className={css["flex-col"]} style={{ gap: "8px", minWidth: 0 }}>
            <Skeleton height={18} width={142} />
            {is_mobile ? (
              <Skeleton height={14} width={88} />
            ) : (
              <div className={clsx(css["flex"], styles.stats)}>
                <Skeleton height={14} width={48} />
                <Skeleton height={14} width={48} />
              </div>
            )}
          </div>
        </div>
        <Grow />
        <div className={clsx(css["flex"], styles.actions)}>
          <Skeleton height={is_mobile ? 36 : 30} width={84} />
          {!is_mobile && <Skeleton height={30} width={30} />}
        </div>
      </div>
      <div
        className={clsx(css["flex-col"], styles.bio)}
        style={{ paddingTop: "8px" }}
      >
        <Skeleton height={14} width={is_mobile ? 312 : 250} />
        <Skeleton height={14} width={is_mobile ? 178 : 192} />
      </div>
    </div>
  );
};

export default React.memo(UserSkeleton);
