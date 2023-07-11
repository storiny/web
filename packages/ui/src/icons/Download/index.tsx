"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const DownloadIcon = (
  <path d="M2 8.5v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1m-6.5-3L6 8m0 0 2.5-2.5M6 8V2" />
);

export default createSvgIcon(DownloadIcon, "download");
