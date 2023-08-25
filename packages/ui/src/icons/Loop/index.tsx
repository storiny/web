"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const LoopIcon = (
  <path d="M2 6V4.5A1.5 1.5 0 0 1 3.5 3H10m0 0L8.5 1.5M10 3 8.5 4.5M10 6v1.5A1.5 1.5 0 0 1 8.5 9H2m0 0 1.5 1.5M2 9l1.5-1.5" />
);

export default createSvgIcon(LoopIcon, "loop");
