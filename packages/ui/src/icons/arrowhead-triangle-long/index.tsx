"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ArrowheadTriangleLongIcon = (
  <path d="M4.5 6h15M4.25 4.25 2.5 6l1.75 1.75v-3.5Z" />
);

export default create_svg_icon(
  ArrowheadTriangleLongIcon,
  "arrowhead-triangle-long",
  {
    viewBox: "0 0 22 12"
  }
);
