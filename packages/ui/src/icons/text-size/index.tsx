"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const TextSizeIcon = (
  <path d="M1.5 3.5v-1H8v1m-3-1v7m1 0H4m3.5-3V6h3v.5M9 6v3.5m-.5 0h1" />
);

export default create_svg_icon(TextSizeIcon, "text-size");
