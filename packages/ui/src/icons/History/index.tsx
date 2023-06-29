"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const HistoryIcon = (
  <path d="M5.9999 4v2l1 1m-5.475-1.5a4.5 4.5 0 1 1 .25 2m-.25 2.5V7.5h2.5" />
);

export default createSvgIcon(HistoryIcon, "history");
