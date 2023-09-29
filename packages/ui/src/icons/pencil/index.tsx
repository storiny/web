"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const PencilIcon = (
  <path d="m6.75 3.25 2 2M2 10h2l5.25-5.25a1.41 1.41 0 0 0-2-2L2 8v2Z" />
);

export default create_svg_icon(PencilIcon, "pencil");
