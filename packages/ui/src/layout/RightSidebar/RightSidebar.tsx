"use client";

import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Grow from "~/components/Grow";
import NoSsr from "~/components/NoSsr";
import Separator from "~/components/Separator";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useSticky } from "~/hooks/useSticky";
// import { selectBannerHeight } from "~/redux/features/banner/selectors";
// import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import sidebarStyles from "../common/Sidebar.module.scss";
import RightSidebarFooter from "./Footer";
import styles from "./RightSidebar.module.scss";
import { RightSidebarProps } from "./RightSidebar.props";

const RightSidebarDefaultContent = dynamic(() => import("./DefaultContent"), {
  loading: dynamicLoader()
});

const RightSidebar = (props: RightSidebarProps): React.ReactElement | null => {
  const {
    className,
    forceMount,
    componentProps,
    children,
    hideFooter,
    ...rest
  } = props;
  // TODO: Uncommment after banner gets fixed
  // const bannerHeight = useAppSelector(selectBannerHeight);
  // Add banner height to the offset
  const stickyRef = useSticky({
    offsetTop: 52
    // + bannerHeight
  });
  const shouldRender = useMediaQuery(breakpoints.up("tablet"));

  if (!shouldRender && !forceMount) {
    return null;
  }

  return (
    <NoSsr>
      <aside
        {...rest}
        className={clsx(
          "flex-col",
          sidebarStyles.sidebar,
          styles["right-sidebar"],
          className
        )}
        data-rsb={"true"}
      >
        <div
          {...componentProps?.wrapper}
          className={clsx(
            "flex-col",
            "full-w",
            styles.wrapper,
            sidebarStyles.wrapper,
            componentProps?.wrapper?.className
          )}
          ref={stickyRef}
        >
          {typeof children !== "undefined" ? (
            children
          ) : (
            <RightSidebarDefaultContent />
          )}
          {!hideFooter && (
            <>
              <Grow />
              <Separator />
              <RightSidebarFooter />
            </>
          )}
        </div>
      </aside>
    </NoSsr>
  );
};

export default RightSidebar;
