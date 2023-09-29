"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const TagIcon = (
  <>
    <path d="M4.25 4.75a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
    <path d="M2 3.5v1.93c0 .27.1.53.3.72l4.05 4.05a1.01 1.01 0 0 0 1.44 0l2.41-2.4a1.01 1.01 0 0 0 0-1.44L6.15 2.3a1 1 0 0 0-.72-.3H3.5A1.5 1.5 0 0 0 2 3.5Z" />
  </>
);

export default create_svg_icon(TagIcon, "tag");
