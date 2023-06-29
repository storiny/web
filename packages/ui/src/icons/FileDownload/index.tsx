"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const FileDownloadIcon = (
  <path d="M7 1.5v2a.5.5 0 0 0 .5.5h2M7 1.5H3.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4M7 1.5 9.5 4M6 8.5v-3m0 3L4.75 7.25M6 8.5l1.25-1.25" />
);

export default createSvgIcon(FileDownloadIcon, "file-download");
