import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";

import styles from "../blog-member-request.module.scss";

const BlogMemberRequestSkeleton = (): React.ReactElement => (
  <div
    aria-busy={"true"}
    className={clsx(css["flex-center"], styles["blog-member-request"])}
    style={{ cursor: "progress" }}
  >
    <div className={clsx(css["flex-center"], styles.meta)}>
      <Skeleton height={32} shape={"circular"} width={32} />
      <div className={css["flex-col"]}>
        <Skeleton height={14} width={96} />
        <Spacer orientation={"vertical"} size={0.5} />
        <Skeleton height={10} width={42} />
      </div>
    </div>
    <Skeleton height={26} width={64} />
  </div>
);

export default React.memo(BlogMemberRequestSkeleton);
