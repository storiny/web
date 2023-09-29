"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const MinimizeIcon = (
  <path d="M7.5 9.5v-1a1 1 0 0 1 1-1h1m-2-5v1a1 1 0 0 0 1 1h1m-7 3h1a1 1 0 0 1 1 1v1m-2-5h1a1 1 0 0 0 1-1v-1" />
);

export default create_svg_icon(MinimizeIcon, "minimize");
