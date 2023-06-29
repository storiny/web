"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const HeartPlusIcon = (
  <path d="M6.5 9.5 6 10 2.25 6.29A2.5 2.5 0 1 1 6 3a2.5 2.5 0 0 1 4 3M7 8h3M8.5 6.5v3" />
);

export default createSvgIcon(HeartPlusIcon, "heart-plus");
