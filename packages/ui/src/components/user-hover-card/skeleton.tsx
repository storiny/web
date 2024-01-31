import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";

import styles from "./user-hover-card.module.scss";

const UserHoverCardSkeleton = (): React.ReactElement => (
  <div
    aria-busy={"true"}
    className={css["flex-col"]}
    style={{ cursor: "progress" }}
  >
    <div className={styles.header}>
      <Skeleton
        className={clsx(styles.x, styles.avatar)}
        height={48}
        shape={"circular"}
        width={48}
      />
      <Skeleton
        className={clsx(styles.x, styles.action)}
        height={30}
        width={30}
      />
    </div>
    <div className={css["flex-col"]} style={{ marginBlock: "2px" }}>
      <Skeleton height={14} width={96} />
      <Spacer orientation={"vertical"} size={0.75} />
      <Skeleton height={12} width={48} />
      <Spacer orientation={"vertical"} size={2.5} />
      <div className={clsx(css.flex, styles.stats)}>
        <Skeleton height={12} width={52} />
        <Skeleton height={12} width={52} />
      </div>
    </div>
  </div>
);

export default UserHoverCardSkeleton;
