import clsx from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Grow from "~/components/grow";
import NoSsr from "~/components/no-ssr";
import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import { StorySkeletonProps } from "~/entities/story/skeleton/skeleton.props";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import story_styles from "../story.module.scss";

const StorySkeleton = (props: StorySkeletonProps): React.ReactElement => {
  const { is_small, virtual } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return (
    <NoSsr>
      <div
        aria-busy={"true"}
        className={clsx(
          "flex-col",
          story_styles.story,
          virtual && story_styles.virtual
        )}
      >
        <div className={clsx("flex", story_styles.main)}>
          <div className={clsx("flex-col", story_styles.meta)}>
            <Skeleton className={story_styles.title} height={24} width={256} />
            <div
              className={clsx("flex-center", story_styles.persona)}
              style={{ paddingBlock: is_mobile ? "10px" : "6px" }}
            >
              <Skeleton height={24} shape={"circular"} width={24} />
              <Spacer />
              <Skeleton height={16} width={152} />
            </div>
            {!is_mobile && (
              <>
                <Spacer orientation={"vertical"} size={0.5} />
                <Skeleton height={14} width={156} />
                <Skeleton height={14} width={196} />
              </>
            )}
          </div>
          <AspectRatio
            className={clsx(
              story_styles.splash,
              is_small && story_styles.small
            )}
            ratio={16 / 9}
            tabIndex={-1}
          >
            <Skeleton no_radius />
          </AspectRatio>
        </div>
        <div className={clsx("flex", story_styles.footer)}>
          {is_small && is_mobile ? (
            <Skeleton height={16} width={130} />
          ) : (
            <React.Fragment>
              {!is_small && <Skeleton height={16} width={54} />}
              <Skeleton height={16} width={54} />
              <Grow />
              <Skeleton height={16} width={is_small ? 32 : 54} />
            </React.Fragment>
          )}
        </div>
      </div>
    </NoSsr>
  );
};

export default React.memo(StorySkeleton);
