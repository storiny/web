"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const LetterSpacingIcon = (
  <path d="M2.5 6V3.25a1.25 1.25 0 0 1 2.5 0V6m0-2H2.5m4-2L8 6l1.5-4m-7 7h7m-7 0 1-1m-1 1 1 1m6-1-1 1m1-1-1-1" />
);

export default create_svg_icon(LetterSpacingIcon, "letter-spacing");
