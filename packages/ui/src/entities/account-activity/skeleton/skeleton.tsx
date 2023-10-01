import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";

import styles from "../account-activity.module.scss";
import { AccountActivitySkeletonProps } from "./skeleton.props";

const AccountActivitySkeleton = (
  props: AccountActivitySkeletonProps
): React.ReactElement => {
  const { hide_pipe, className, ...rest } = props;
  return (
    <div
      {...rest}
      aria-busy={"true"}
      className={clsx(
        css["flex"],
        styles["account-activity"],
        hide_pipe && styles["hide-pipe"],
        className
      )}
      style={{ cursor: "progress" }}
    >
      <Skeleton height={48} shape={"circular"} width={48} />
      <div className={css["flex-col"]}>
        <Skeleton height={16} width={144} />
        <Spacer orientation={"vertical"} size={0.75} />
        <Skeleton height={14} width={96} />
      </div>
    </div>
  );
};

export default React.memo(AccountActivitySkeleton);
