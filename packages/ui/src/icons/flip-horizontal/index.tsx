"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FlipHorizontalIcon = (
  <path d="M6 1.5v9m2-7v5h2.5L8 3.5Zm-4 0v5H1.5l2.5-5Z" />
);

export default create_svg_icon(FlipHorizontalIcon, "flip-horizontal");
