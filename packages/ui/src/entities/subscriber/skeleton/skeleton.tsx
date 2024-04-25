import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";

import styles from "../subscriber.module.scss";

const SubscriberSkeleton = (): React.ReactElement => (
  <div
    aria-busy={"true"}
    className={clsx(css["flex-center"], styles.subscriber)}
    style={{ cursor: "progress" }}
  >
    <div className={css["flex-col"]}>
      <Skeleton height={14} width={96} />
      <Spacer orientation={"vertical"} size={0.5} />
      <Skeleton height={10} width={42} />
    </div>
    <Skeleton height={26} width={64} />
  </div>
);

export default React.memo(SubscriberSkeleton);
