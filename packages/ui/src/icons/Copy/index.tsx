"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CopyIcon = (
  <path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1m0-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" />
);

export default createSvgIcon(CopyIcon, "copy");
