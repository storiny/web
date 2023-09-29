"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const SelectIcon = (
  <path d="m10.5 1.5-3.25 9a.28.28 0 0 1-.5 0L5 7 1.5 5.25a.28.28 0 0 1 0-.5l9-3.25Z" />
);

export default create_svg_icon(SelectIcon, "select");
