"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const PhotoPlusIcon = (
  <path d="M6.25 10.5H3A1.5 1.5 0 0 1 1.5 9V3A1.5 1.5 0 0 1 3 1.5h6A1.5 1.5 0 0 1 10.5 3v3.25M1.5 8 4 5.5c.46-.45 1.04-.45 1.5 0l2 2M7 7l.5-.5c.33-.32.72-.41 1.1-.27M8 9.5h3M9.5 8v3" />
);

export default create_svg_icon(PhotoPlusIcon, "photo-plus");
