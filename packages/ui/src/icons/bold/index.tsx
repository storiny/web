"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const BoldIcon = (
  <path d="M6.5 6a1.75 1.75 0 1 0 0-3.5h-3V6m3 0h-3m3 0H7a1.75 1.75 0 1 1 0 3.5H3.5V6" />
);

export default create_svg_icon(BoldIcon, "bold");
