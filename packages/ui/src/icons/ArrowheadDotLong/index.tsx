"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const ArrowheadDotLongIcon = (
  <path d="M5.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h14" />
);

export default createSvgIcon(ArrowheadDotLongIcon, "arrowhead-dot-long", {
  viewBox: "0 0 22 12"
});
