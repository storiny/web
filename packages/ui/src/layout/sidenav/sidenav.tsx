"use client";

import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/no-ssr";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { SidenavProps } from "./sidenav.props";

const SidenavStatic = dynamic(() => import("./static-content"));

const Sidenav = (props: SidenavProps): React.ReactElement | null => {
  const { force_mount, is_dashboard, ...rest } = props;
  const skip_render = use_media_query(
    `${BREAKPOINTS.down("mobile")}, ${BREAKPOINTS.up(
      is_dashboard ? "desktop" : "tablet"
    )}`
  );

  if ((skip_render && !force_mount) || typeof window === "undefined") {
    return null;
  }

  return (
    <NoSsr>
      <SidenavStatic {...rest} />
    </NoSsr>
  );
};

export default Sidenav;
