"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const HeartOffIcon = (
  <path d="m1.5 1.5 9 9M9 7l.75-.714A2.5 2.5 0 1 0 6 3c-.475-.636-1.22-1-2-1m4 6-2 2-3.75-3.714a2.5 2.5 0 0 1-.644-2.534c.158-.501.471-.94.894-1.252" />
);

export default create_svg_icon(HeartOffIcon, "heart-off");
