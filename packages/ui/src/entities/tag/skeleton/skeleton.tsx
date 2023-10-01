import clsx from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Skeleton from "~/components/skeleton";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import tag_styles from "../tag.module.scss";
import { TagSkeletonProps } from "./skeleton.props";

const TagSkeleton = (props: TagSkeletonProps): React.ReactElement => {
  const { virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <div
      aria-busy={"true"}
      className={clsx(
        css["flex-col"],
        tag_styles.tag,
        virtual && tag_styles.virtual
      )}
      style={{ cursor: "progress" }}
    >
      <div className={clsx(css["flex-center"], tag_styles.main)}>
        <div className={clsx(css["flex-center"], tag_styles.meta)}>
          <Skeleton
            className={tag_styles.avatar}
            height={is_mobile ? 36 : 30}
            shape={"circular"}
            width={is_mobile ? 36 : 30}
          />
          <Skeleton height={18} width={142} />
        </div>
        <Grow />
        <Skeleton height={is_mobile ? 36 : 30} width={is_mobile ? 92 : 80} />
      </div>
      <div className={clsx(css["flex-center"], tag_styles.stats)}>
        <Skeleton height={14} width={64} />
        <Skeleton height={14} width={64} />
        <Grow />
        <Skeleton height={14} width={is_mobile ? 48 : 108} />
      </div>
    </div>
  );
};

export default React.memo(TagSkeleton);
