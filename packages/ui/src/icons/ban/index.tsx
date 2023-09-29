"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const BanIcon = (
  <path d="m2.85 3.48 6.3 6.3M1.5 6.63a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z" />
);

export default create_svg_icon(BanIcon, "ban");
