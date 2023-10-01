import clsx from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Grow from "~/components/grow";
import NoSsr from "~/components/no-ssr";
import Skeleton from "~/components/skeleton";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import comment_styles from "../comment.module.scss";
import { CommentSkeletonProps } from "./skeleton.props";

const CommentSkeleton = (props: CommentSkeletonProps): React.ReactElement => {
  const { is_extended, virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <NoSsr>
      <div
        aria-busy={"true"}
        className={clsx(
          css["flex-col"],
          comment_styles.comment,
          virtual && comment_styles.virtual
        )}
      >
        <div
          className={clsx(css["flex"], comment_styles["story-persona"])}
          style={{ alignItems: "center" }}
        >
          {is_extended ? (
            <AspectRatio
              className={comment_styles["story-splash"]}
              ratio={1.77}
              tabIndex={-1}
            >
              <Skeleton no_radius />
            </AspectRatio>
          ) : (
            <Skeleton height={32} shape={"circular"} width={32} />
          )}
          <Skeleton height={18} width={114} />
        </div>
        <div className={css["flex-col"]} style={{ gap: "6px" }}>
          <Skeleton height={10} width={236} />
          <Skeleton height={10} width={140} />
          <Skeleton height={10} width={200} />
        </div>
        <div className={css["flex-center"]}>
          <Skeleton
            height={is_mobile || is_extended ? 18 : 14}
            width={is_mobile || is_extended ? 52 : 48}
          />
          <Grow />
          <Skeleton height={is_mobile || is_extended ? 18 : 14} width={60} />
        </div>
      </div>
    </NoSsr>
  );
};

export default React.memo(CommentSkeleton);
