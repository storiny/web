"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const ClockIcon = (
  <path d="M6 3.5V6l1.5 1.5M1.5 6a4.5001 4.5001 0 0 0 7.682 3.182A4.5009 4.5009 0 0 0 10.5 6a4.5 4.5 0 1 0-9 0Z" />
);

export default create_svg_icon(ClockIcon, "clock");
