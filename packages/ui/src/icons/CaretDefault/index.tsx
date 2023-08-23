"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CaretDefaultIcon = (
  <path d="M1.85 6h3.18M1.85 6V3.5m0 2.5v2.5m3.98-.64a2.63 2.63 0 1 1 3.71-3.72 2.63 2.63 0 0 1-3.71 3.72Z" />
);

export default createSvgIcon(CaretDefaultIcon, "caret-default");
