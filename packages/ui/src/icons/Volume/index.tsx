"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const VolumeIcon = (
  <path d="M7.5 4a2.5 2.5 0 0 1 0 4m1.35-5.5a4.5 4.5 0 0 1 0 7M3 7.5H2a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5h1l1.75-2.25a.4.4 0 0 1 .75.25v7a.4.4 0 0 1-.75.25L3 7.5Z" />
);

export default createSvgIcon(VolumeIcon, "volume");
