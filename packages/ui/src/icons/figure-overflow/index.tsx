"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FigureOverflowIcon = (
  <path d="M3.67 1.75a.25.25 0 0 0 0 .5h4.66a.25.25 0 0 0 0-.5H3.67ZM3.67 9.75a.25.25 0 0 0 0 .5h4.66a.25.25 0 1 0 0-.5H3.67ZM2.43 3.5a.6.6 0 0 0-.6.6v3.8c0 .33.27.6.6.6h7.14a.6.6 0 0 0 .6-.6V4.1a.6.6 0 0 0-.6-.6H2.43Z" />
);

export default create_svg_icon(FigureOverflowIcon, "figure-overflow", {
  no_stroke: true
});
