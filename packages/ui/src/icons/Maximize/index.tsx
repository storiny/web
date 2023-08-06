"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const MaximizeIcon = (
  <path d="M2 4V3a1 1 0 0 1 1-1h1M2 8v1a1 1 0 0 0 1 1h1m4-8h1a1 1 0 0 1 1 1v1m-2 6h1a1 1 0 0 0 1-1V8" />
);

export default createSvgIcon(MaximizeIcon, "maximize");
