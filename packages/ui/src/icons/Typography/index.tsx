"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const TypographyIcon = (
  <path d="M2 10h1.5M7 10h3.5M3.45 7.5H6.9M5.1 3.15 8 10m-5.5 0 3-8h1l3.5 8" />
);

export default createSvgIcon(TypographyIcon, "typography");
