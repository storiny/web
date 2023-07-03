import { clsx } from "clsx";
import React from "react";

import Skeleton from "~/components/Skeleton";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./writers.module.scss";

const WriterSkeleton = (): React.ReactElement => (
  <div className={clsx("flex-col", "flex-center", styles.x, styles.writer)}>
    <Skeleton height={48} shape={"circular"} width={48} />
    <Typography className={clsx("flex-col", "flex-center")}>
      <Skeleton height={14} width={48} />
      <Spacer orientation={"vertical"} size={1} />
      <Skeleton height={12} width={64} />
    </Typography>
  </div>
);

export default WriterSkeleton;
