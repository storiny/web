import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";

import styles from "../collaboration-request.module.scss";
import { CollaborationRequestSkeletonProps } from "./skeleton.props";

const CollaborationRequestSkeleton = ({
  type = "received"
}: CollaborationRequestSkeletonProps): React.ReactElement => (
  <div
    aria-busy={"true"}
    className={clsx(css["flex-center"], styles["collaboration-request"])}
    style={{ cursor: "progress" }}
  >
    <div className={clsx(css["flex-center"], styles.meta)}>
      <Skeleton height={32} shape={"circular"} width={32} />
      <div className={css["flex-col"]}>
        <Skeleton height={14} width={144} />
        <Spacer orientation={"vertical"} size={0.5} />
        <Skeleton height={10} width={42} />
      </div>
    </div>
    <div className={clsx(css["flex-center"], styles.actions)}>
      <Skeleton height={26} width={64} />
      {type === "received" && <Skeleton height={26} width={64} />}
    </div>
  </div>
);

export default React.memo(CollaborationRequestSkeleton);
