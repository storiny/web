"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FiltersIcon = (
  <path d="M6.79 6.9A3 3 0 0 1 6 10.22m0 0A3 3 0 1 1 3.21 5.1M6 10.23A3 3 0 1 0 8.79 5.1M3 4a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
);

export default create_svg_icon(FiltersIcon, "filters");
