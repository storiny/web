"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const LogoutIcon = (
  <path d="M7 4V3a1 1 0 0 0-1-1H2.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H6a1 1 0 0 0 1-1V8M4.5 6h6m0 0L9 4.5M10.5 6 9 7.5" />
);

export default createSvgIcon(LogoutIcon, "logout");
