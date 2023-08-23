"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const SidebarCollapseIcon = (
  <path d="M7.5 2v8m-3-5 1 1-1 1M2 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Z" />
);

export default createSvgIcon(SidebarCollapseIcon, "sidebar-collapse");
