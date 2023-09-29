"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const CompassIcon = (
  <>
    <path d="m4 8 1-3 3-1-1 3-3 1Z" />
    <path d="M1.5 6a4.5001 4.5001 0 0 0 7.682 3.182A4.5009 4.5009 0 0 0 10.5 6a4.5009 4.5009 0 0 0-1.318-3.182A4.5001 4.5001 0 0 0 1.5 6Z" />
  </>
);

export default create_svg_icon(CompassIcon, "compass");
