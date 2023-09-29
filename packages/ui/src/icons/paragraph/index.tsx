"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ParagraphIcon = (
  <path d="M6.5 2v8m2-8v8m1-8H4.75a2.25 2.25 0 1 0 0 4.5H6.5" />
);

export default create_svg_icon(ParagraphIcon, "paragraph");
