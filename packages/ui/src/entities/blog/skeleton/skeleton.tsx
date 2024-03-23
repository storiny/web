import clsx from "clsx";
import React from "react";

import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "../blog.module.scss";
import { BlogSkeletonProps } from "./skeleton.props";

const BlogSkeleton = (props: BlogSkeletonProps): React.ReactElement => {
  const { virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx(css.flex, styles.blog, virtual && styles.virtual)}
      style={{ cursor: "progress" }}
    >
      <Skeleton
        className={clsx(styles.x, styles.logo)}
        height={64}
        width={64}
      />
      <div className={clsx(css["flex-col"], styles.main, styles["has-logo"])}>
        <div className={css.flex}>
          <div
            className={clsx(css["flex-col"])}
            style={{ maxWidth: "calc(100% - 52px)", gap: "6px" }}
          >
            <Skeleton height={18} width={214} />
            <Skeleton height={10} width={48} />
          </div>
          <Spacer className={css["f-grow"]} size={2} />
          <Skeleton height={is_mobile ? 36 : 30} width={is_mobile ? 36 : 30} />
        </div>
        <div
          className={clsx(css["flex-col"], styles.description)}
          style={{ paddingTop: "8px" }}
        >
          <Skeleton height={14} width={276} />
          <Skeleton height={14} width={135} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(BlogSkeleton);
