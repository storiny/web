"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const SidebarIcon = (
  <path d="M4.5 2v8M2 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Z" />
);

export default create_svg_icon(SidebarIcon, "sidebar");
