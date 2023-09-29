"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const SolidFillIcon = (
  <path d="M1.25 2.3a1.06 1.06 0 0 1 1.06-1.05h7.38a1.06 1.06 0 0 1 1.06 1.06v7.38a1.06 1.06 0 0 1-1.06 1.06H2.31a1.06 1.06 0 0 1-1.06-1.06V2.31Z" />
);

export default create_svg_icon(SolidFillIcon, "solid-fill", {
  no_stroke: true
});
