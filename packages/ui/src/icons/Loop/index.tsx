"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const LoopIcon = (
  <path d="M2 6V4.5A1.5 1.5 0 0 1 3.5 3H10m0 0L8.5 1.5M10 3 8.5 4.5M10 6v1.5A1.5 1.5 0 0 1 8.5 9H2m0 0 1.5 1.5M2 9l1.5-1.5" />
);

export default create_svg_icon(LoopIcon, "loop");
