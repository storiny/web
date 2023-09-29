"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const BasketballIcon = (
  <path d="M1.5 6A4.5 4.5 0 0 0 6 10.5M1.5 6A4.5 4.5 0 0 1 6 1.5M1.5 6A4.5 4.5 0 0 1 6 10.5m0 0A4.5 4.5 0 0 0 10.5 6m0 0A4.5 4.5 0 0 0 6 1.5M10.5 6A4.5 4.5 0 0 1 6 1.5M2.83 2.83l6.35 6.35m-6.35 0 6.35-6.35" />
);

export default create_svg_icon(BasketballIcon, "basketball");
