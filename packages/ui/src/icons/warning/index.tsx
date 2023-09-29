"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const WarningIcon = (
  <path d="M6 4.5v2m0 2h0m-.88-6.52L.91 9a1 1 0 0 0 .85 1.49h8.42a1 1 0 0 0 .85-1.5L6.82 1.99a1 1 0 0 0-1.7 0Z" />
);

export default create_svg_icon(WarningIcon, "warning");
