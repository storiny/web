"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CaptionIcon = (
  <path d="M2 7.5h8M2 10h6M2 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Z" />
);

export default createSvgIcon(CaptionIcon, "caption");
