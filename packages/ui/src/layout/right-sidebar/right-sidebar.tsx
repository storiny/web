"use client";

import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Grow from "~/components/grow";
import NoSsr from "~/components/no-ssr";
import Separator from "~/components/separator";
import { use_media_query } from "~/hooks/use-media-query";
import { use_sticky } from "~/hooks/use-sticky";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import sidebar_styles from "../common/sidebar.module.scss";
import RightSidebarFooter from "./footer";
import styles from "./right-sidebar.module.scss";
import { RightSidebarProps } from "./right-sidebar.props";

const RightSidebarDefaultContent = dynamic(() => import("./default-content"), {
  loading: dynamic_loader()
});

const RightSidebar = (props: RightSidebarProps): React.ReactElement | null => {
  const {
    className,
    force_mount,
    component_props,
    children,
    hide_footer,
    ...rest
  } = props;
  const sticky_ref = use_sticky({
    offset_top: 52 // TODO: Add <Banner /> height to the offset after banner gets implemented
  });
  const should_render = use_media_query(BREAKPOINTS.up("tablet"));

  if (!should_render && !force_mount) {
    return null;
  }

  return (
    <NoSsr>
      <aside
        {...rest}
        className={clsx(
          css["flex-col"],
          sidebar_styles.sidebar,
          styles["right-sidebar"],
          className
        )}
        data-rsb={"true"}
      >
        <div
          {...component_props?.wrapper}
          className={clsx(
            css["flex-col"],
            css["full-w"],
            styles.wrapper,
            sidebar_styles.wrapper,
            component_props?.wrapper?.className
          )}
          ref={sticky_ref}
        >
          {typeof children !== "undefined" ? (
            children
          ) : (
            <RightSidebarDefaultContent />
          )}
          {!hide_footer && (
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
