import { clsx } from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import styles from "./writers.module.scss";

const WriterSkeleton = (): React.ReactElement => (
  <div className={clsx("flex-col", "flex-center", styles.x, styles.writer)}>
    <Skeleton height={48} shape={"circular"} width={48} />
    <Typography className={clsx("flex-col", "flex-center")}>
      <Skeleton height={14} width={48} />
      <Spacer orientation={"vertical"} />
      <Skeleton height={12} width={64} />
    </Typography>
  </div>
);

export default WriterSkeleton;
