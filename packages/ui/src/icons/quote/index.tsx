"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const QuoteIcon = (
  <path d="M5 5.5H3a.5.5 0 0 1-.5-.5V3.5A.5.5 0 0 1 3 3h1.5a.5.5 0 0 1 .5.5v3C5 7.83 4.33 8.67 3 9m6.5-3.5h-2A.5.5 0 0 1 7 5V3.5a.5.5 0 0 1 .5-.5H9a.5.5 0 0 1 .5.5v3c0 1.33-.67 2.17-2 2.5" />
);

export default create_svg_icon(QuoteIcon, "quote");
