"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const ShareIcon = (
  <path d="M4 4.5h-.5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h5a1.0002 1.0002 0 0 0 1-1v-4a1 1 0 0 0-1-1H8M6 7V1.5m0 0L4.5 3M6 1.5 7.5 3" />
);

export default create_svg_icon(ShareIcon, "share");
