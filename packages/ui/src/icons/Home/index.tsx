"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const HomeIcon = (
  <path d="M4.5 10.5v-3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3M2.5 6h-1L6 1.5 10.5 6h-1v3.5a1 1 0 0 1-1 1h-5a1.0002 1.0002 0 0 1-1-1V6Z" />
);

export default createSvgIcon(HomeIcon, "home");
