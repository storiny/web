import clsx from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Grow from "~/components/Grow";
import NoSsr from "~/components/NoSsr";
import Skeleton from "~/components/Skeleton";
import Spacer from "~/components/Spacer";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import storyStyles from "../Story.module.scss";

const StorySkeleton = () => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return (
    <NoSsr>
      <div aria-busy={"true"} className={clsx("flex-col", storyStyles.story)}>
        <div className={clsx("flex", storyStyles.main)}>
          <div className={clsx("flex-col", storyStyles.meta)}>
            <Skeleton className={storyStyles.title} height={24} width={256} />
            <div
              className={clsx("flex-center", storyStyles.persona)}
              style={{ paddingBlock: isMobile ? "10px" : "6px" }}
            >
              <Skeleton height={24} shape={"circular"} width={24} />
              <Spacer />
              <Skeleton height={16} width={152} />
            </div>
            {!isMobile && (
              <>
                <Spacer orientation={"vertical"} size={0.5} />
                <Skeleton height={14} width={156} />
                <Skeleton height={14} width={196} />
              </>
            )}
          </div>
          <AspectRatio
            className={storyStyles.splash}
            ratio={16 / 9}
            tabIndex={-1}
          >
            <Skeleton />
          </AspectRatio>
        </div>
        <footer className={clsx("flex", storyStyles.footer)}>
          <Skeleton height={16} width={54} />
          <Skeleton height={16} width={54} />
          <Grow />
          <Skeleton height={16} width={54} />
        </footer>
      </div>
    </NoSsr>
  );
};

export default React.memo(StorySkeleton);
