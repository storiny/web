"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const DashedFillIcon = (
  <path
    d={
      "M4.33 1.67V4.5m0 5.83V7.42M8 1.67V4.5m0 5.83V7.42M1.5 2.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7Z"
    }
  />
);

export default createSvgIcon(DashedFillIcon, "dashed-fill");
