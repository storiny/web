"use client";

import { BREAKPOINTS } from "@storiny/ui/src/theme/breakpoints";
import dynamic from "next/dynamic";
import React from "react";

import { use_media_query } from "~/hooks/use-media-query";

const DropdownClient = dynamic(() => import("./client"));

const Dropdown = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.down("desktop"));

  if (!should_render) {
    return null;
  }

  return <DropdownClient />;
};

export default Dropdown;
