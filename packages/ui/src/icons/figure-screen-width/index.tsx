"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FigureScreenWidthIcon = (
  <path d="M3.67 9.75a.25.25 0 0 0 0 .5h4.66a.25.25 0 1 0 0-.5H3.67ZM2.43 1.75a.6.6 0 0 0-.6.6V7.9c0 .32.27.59.6.59h7.14a.6.6 0 0 0 .6-.6V2.35a.6.6 0 0 0-.6-.59H2.43Z" />
);

export default create_svg_icon(FigureScreenWidthIcon, "figure-screen-width", {
  no_stroke: true
});
