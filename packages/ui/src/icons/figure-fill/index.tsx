"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const FigureFillIcon = (
  <path d="M2 1.75a.25.25 0 0 0 0 .5h8a.25.25 0 1 0 0-.5H2ZM2 9.75a.25.25 0 0 0 0 .5h8a.25.25 0 1 0 0-.5H2ZM2.6 3.5a.6.6 0 0 0-.6.6v3.8c0 .33.27.6.6.6h6.8a.6.6 0 0 0 .6-.6V4.1a.6.6 0 0 0-.6-.6H2.6Z" />
);

export default create_svg_icon(FigureFillIcon, "figure-fill", {
  no_stroke: true
});
