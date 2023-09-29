"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const SearchIcon = (
  <path d="m10.5 10.5-3-3M1.5 5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
);

export default create_svg_icon(SearchIcon, "search");
