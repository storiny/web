"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const NumberedListIcon = (
  <path d="M5.5 3H10M5.5 6H10M6 9h4M2 8a1 1 0 0 1 2 0c0 .3-.25.5-.5.75L2 10h2M3 5V2L2 3" />
);

export default createSvgIcon(NumberedListIcon, "numbered-list");
