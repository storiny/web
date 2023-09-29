"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ChecksIcon = (
  <path d="M3.5 6.63 6 9.13l5-5M1 6.63l2.5 2.5M6 6.63l2.5-2.5" />
);

export default create_svg_icon(ChecksIcon, "checks");
