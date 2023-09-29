"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const BlurIcon = (
  <path d="M6 1.5V10m0-4h4.5M6 4.5h4M6 3h3M6 9h3M6 7.5h4m-4 3a4.5 4.5 0 1 0 0-9.01 4.5 4.5 0 0 0 0 9.01Z" />
);

export default create_svg_icon(BlurIcon, "blur");
