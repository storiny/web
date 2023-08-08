"use client";

import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/NoSsr";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import { SidenavProps } from "./Sidenav.props";

const SidenavStatic = dynamic(() => import("./Static"));

const Sidenav = (props: SidenavProps): React.ReactElement | null => {
  const { forceMount, isDashboard, ...rest } = props;
  const skipRender = useMediaQuery(
    `${breakpoints.down("mobile")}, ${breakpoints.up(
      isDashboard ? "desktop" : "tablet"
    )}`
  );

  if ((skipRender && !forceMount) || typeof window === "undefined") {
    return null;
  }

  return (
    <NoSsr>
      <SidenavStatic {...rest} />
    </NoSsr>
  );
};

export default Sidenav;
