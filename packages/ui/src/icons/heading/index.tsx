"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const HeadingIcon = (
  <path d="M2 3.5v6m4-6v6m-.5 0h1m-5 0h1m-.5-3h4m-4.5-3h1m3 0h1m1.881 2v4h2.5" />
);

export default create_svg_icon(HeadingIcon, "heading");
