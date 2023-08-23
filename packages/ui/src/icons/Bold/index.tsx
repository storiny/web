"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const BoldIcon = (
  <path d="M6.5 6a1.75 1.75 0 1 0 0-3.5h-3V6m3 0h-3m3 0H7a1.75 1.75 0 1 1 0 3.5H3.5V6" />
);

export default createSvgIcon(BoldIcon, "bold");
