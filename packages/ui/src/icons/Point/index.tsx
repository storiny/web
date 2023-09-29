"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const PointIcon = (
  <path d="M6 3.5a2.5 2.5 0 1 1-2.5 2.6v-.2A2.5 2.5 0 0 1 6 3.5Z" />
);

export default create_svg_icon(PointIcon, "point", { no_stroke: true });
