"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const CopyIcon = (
  <path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1m0-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" />
);

export default create_svg_icon(CopyIcon, "copy");
