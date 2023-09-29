"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const EyeIcon = (
  <>
    <path d="M5 6a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />
    <path d="M10.5 6C9.3 8 7.8 9 6 9 4.2 9 2.7 8 1.5 6 2.7 4 4.2 3 6 3c1.8 0 3.3 1 4.5 3Z" />
  </>
);

export default create_svg_icon(EyeIcon, "eye");
