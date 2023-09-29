"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ExplicitIcon = (
  <path d="M7 4H5v4h2m0-2H5M2 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7Z" />
);

export default create_svg_icon(ExplicitIcon, "explicit");
