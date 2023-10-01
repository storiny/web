import clsx from "clsx";
import React from "react";

import Grow from "~/components/grow";
import NoSsr from "~/components/no-ssr";
import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import { ReplySkeletonProps } from "~/entities/reply/skeleton/skeleton.props";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import reply_styles from "../reply.module.scss";

const ReplySkeleton = (props: ReplySkeletonProps): React.ReactElement => {
  const { virtual, is_static, nested } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <NoSsr>
      <div
        aria-busy={"true"}
        className={clsx(
          css["flex-col"],
          reply_styles.reply,
          virtual && reply_styles.virtual,
          is_static && reply_styles.static,
          nested && reply_styles.nested
        )}
      >
        <div className={css["flex"]} style={{ alignItems: "center" }}>
          <Skeleton height={32} shape={"circular"} width={32} />
          <Spacer size={1.25} />
          <Skeleton height={18} width={114} />
        </div>
        <div
          className={clsx(css["flex-col"], reply_styles.content)}
          style={{ gap: "6px" }}
        >
          <Skeleton height={10} width={236} />
          <Skeleton height={10} width={140} />
          <Skeleton height={10} width={200} />
        </div>
        <div className={css["flex-center"]}>
          <Grow />
          <Skeleton height={is_mobile ? 18 : 14} width={is_mobile ? 52 : 48} />
        </div>
      </div>
    </NoSsr>
  );
};

export default React.memo(ReplySkeleton);
