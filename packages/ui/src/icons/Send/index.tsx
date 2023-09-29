"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const SendIcon = (
  <path d="m5 7 5.5-5.5M5 7l1.75 3.5a.28.28 0 0 0 .5 0l3.25-9M5 7 1.5 5.25a.28.28 0 0 1 0-.5l9-3.25" />
);

export default create_svg_icon(SendIcon, "send");
