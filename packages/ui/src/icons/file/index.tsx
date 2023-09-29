"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const FileIcon = (
  <path d="M7 1.5v2a.5.5 0 0 0 .5.5h2M7 1.5H3.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4M7 1.5 9.5 4m-5 .5H5m-.5 2h3m-3 2h3" />
);

export default create_svg_icon(FileIcon, "file");
