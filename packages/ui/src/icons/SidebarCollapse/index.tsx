"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const SidebarCollapseIcon = (
  <path d="M7.5 2v8m-3-5 1 1-1 1M2 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Z" />
);

export default create_svg_icon(SidebarCollapseIcon, "sidebar-collapse");
