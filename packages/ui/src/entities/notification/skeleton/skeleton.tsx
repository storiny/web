import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "../notification.module.scss";
import { NotificationSkeletonProps } from "./skeleton.props";

const NotificationSkeleton = (
  props: NotificationSkeletonProps
): React.ReactElement => {
  const { virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  return (
    <div
      aria-busy={"true"}
      className={clsx(
        css["flex"],
        styles.notification,
        virtual && styles.virtual
      )}
    >
      <Skeleton
        height={is_mobile ? 36 : 48}
        shape={"circular"}
        width={is_mobile ? 36 : 48}
      />
      <div className={css["flex-col"]}>
        <Skeleton height={is_mobile ? 15 : 18} width={198} />
        <Spacer orientation={"vertical"} />
        <Skeleton height={is_mobile ? 12 : 14} width={82} />
      </div>
    </div>
  );
};

export default React.memo(NotificationSkeleton);
