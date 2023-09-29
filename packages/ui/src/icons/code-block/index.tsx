"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const CodeBlockIcon = (
  <path d="M7.25 2H8.5A1.5 1.5 0 0 1 10 3.5v5A1.5 1.5 0 0 1 8.5 10h-5A1.5 1.5 0 0 1 2 8.5V6m1-3.5-1 1 1 1m2 0 1-1-1-1" />
);

export default create_svg_icon(CodeBlockIcon, "code-block");
