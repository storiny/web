"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const LockOpenIcon = (
  <path d="M4 5.5V3a2 2 0 1 1 4 0M2.5 6.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-3Zm3 1.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Z" />
);

export default createSvgIcon(LockOpenIcon, "lock-open");
