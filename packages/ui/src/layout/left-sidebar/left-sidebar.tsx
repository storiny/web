"use client";

import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "src/components/no-ssr";
import { use_media_query } from "src/hooks/use-media-query";
import { use_sticky } from "src/hooks/use-sticky";
import { BREAKPOINTS } from "~/theme/breakpoints";

import sidebar_styles from "../common/sidebar.module.scss";
import styles from "./left-sidebar.module.scss";
import { LeftSidebarProps } from "./left-sidebar.props";

const LeftSidebarDefaultContent = dynamic(() => import("./default-content"), {
  loading: dynamic_loader()
});

const LeftSidebar = (props: LeftSidebarProps): React.ReactElement | null => {
  const { className, force_mount, component_props, children, ...rest } = props;
  const sticky_ref = use_sticky({
    offset_top: 52 // TODO: Add banner height to the offset after banner gets implemented
  });
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render && !force_mount) {
    return null;
  }

  return (
    <NoSsr>
      <aside
        {...rest}
        className={clsx(
          "flex-col",
          sidebar_styles.sidebar,
          styles["left-sidebar"],
          className
        )}
        data-lsb={"true"}
      >
        <div
          {...component_props?.wrapper}
          className={clsx(
            "flex-col",
            "full-w",
            styles.wrapper,
            sidebar_styles.wrapper,
            component_props?.wrapper?.className
          )}
          ref={sticky_ref}
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
