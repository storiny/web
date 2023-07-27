"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const AxisXIcon = (
  <path d="M2 6.5v0m0-2v0m0-2v0M8.5 10 10 8.5m0 0L8.5 7M10 8.5H2" />
);

export default createSvgIcon(AxisXIcon, "axis-x");
