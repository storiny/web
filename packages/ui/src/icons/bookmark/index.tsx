"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const BookmarkIcon = (
  <path d="M4.5 2h3a1 1 0 0 1 1 1v7L6 8.5 3.5 10V3a1 1 0 0 1 1-1Z" />
);

export default create_svg_icon(BookmarkIcon, "bookmark");
