"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const DottedFillIcon = (
  <path
    d={
      "M4.3 4.3v.02m3.66-.02v.02m0 3.38v.01M4.3 7.7v.01M1.5 2.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7Z"
    }
  />
);

export default createSvgIcon(DottedFillIcon, "dotted-fill");
