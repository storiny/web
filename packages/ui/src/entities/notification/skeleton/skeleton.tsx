import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/Skeleton";
import Spacer from "~/components/Spacer";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import styles from "../notification.module.scss";
import { NotificationSkeletonProps } from "./skeleton.props";

const NotificationSkeleton = (
  props: NotificationSkeletonProps
): React.ReactElement => {
  const { virtual } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx("flex", styles.notification, virtual && styles.virtual)}
    >
      <Skeleton
        height={isMobile ? 36 : 48}
        shape={"circular"}
        width={isMobile ? 36 : 48}
      />
      <div className={"flex-col"}>
        <Skeleton height={isMobile ? 15 : 18} width={198} />
        <Spacer orientation={"vertical"} />
        <Skeleton height={isMobile ? 12 : 14} width={82} />
      </div>
    </div>
  );
};

export default React.memo(NotificationSkeleton);
