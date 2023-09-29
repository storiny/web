"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const HeartIcon = (
  <path d="M9.75 6.29 6 10 2.25 6.29A2.5 2.5 0 1 1 6 3 2.5 2.5 0 1 1 9.75 6.3" />
);

export default create_svg_icon(HeartIcon, "heart");
