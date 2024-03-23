"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FileUploadIcon = (
  <path d="M7 1.5v2a.5.5 0 0 0 .5.5h2M7 1.5H3.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4M7 1.5 9.5 4M6 5.5v3m0-3L4.75 6.75M6 5.5l1.25 1.25" />
);

export default create_svg_icon(FileUploadIcon, "file-upload");
