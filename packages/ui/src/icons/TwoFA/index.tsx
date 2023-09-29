"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const TwoFAIcon = (
  <path d="M3.5 8h-2l1.73-2.33A1 1 0 1 0 1.5 4.9M5 8V4h2M5 6h1.5m2 2V5a1 1 0 0 1 2 0v3m-2-1.5h2" />
);

export default create_svg_icon(TwoFAIcon, "2fa");
