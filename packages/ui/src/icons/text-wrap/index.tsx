"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const TextWrapIcon = (
  <path d="M2 3h8M2 9h2.5M2 6h6.5a1.5 1.5 0 0 1 0 3h-2m0 0 1-1m-1 1 1 1" />
);

export default create_svg_icon(TextWrapIcon, "text-wrap");
