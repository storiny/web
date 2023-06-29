"use client";

import { breakpoints } from "@storiny/ui/src/theme/breakpoints";
import dynamic from "next/dynamic";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";

const DropdownClient = dynamic(() => import("./client"));

const Dropdown = (): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.down("desktop"));

  if (!shouldRender) {
    return null;
  }

  return <DropdownClient />;
};

export default Dropdown;
