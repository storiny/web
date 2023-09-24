"use client";

import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/NoSsr";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useSticky } from "~/hooks/useSticky";
// import { selectBannerHeight } from "~/redux/features/banner/selectors";
// import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import sidebarStyles from "../common/Sidebar.module.scss";
import styles from "./LeftSidebar.module.scss";
import { LeftSidebarProps } from "./LeftSidebar.props";

const LeftSidebarDefaultContent = dynamic(() => import("./DefaultContent"), {
  loading: dynamicLoader()
});

const LeftSidebar = (props: LeftSidebarProps): React.ReactElement | null => {
  const { className, forceMount, componentProps, children, ...rest } = props;
  // TODO: Uncommment after banner gets fixed
  // const bannerHeight = useAppSelector(selectBannerHeight);
  // Add banner height to the offset
  const stickyRef = useSticky({
    offsetTop: 52
    // + bannerHeight
  });
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

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
          styles["left-sidebar"],
          className
        )}
        data-lsb={"true"}
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
            <LeftSidebarDefaultContent />
          )}
        </div>
      </aside>
    </NoSsr>
  );
};

export default LeftSidebar;
