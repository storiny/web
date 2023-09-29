"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const UploadIcon = (
  <path d="M2 8.5v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1m-6.5-4L6 2m0 0 2.5 2.5M6 2v6" />
);

export default create_svg_icon(UploadIcon, "upload");
