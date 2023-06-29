"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const BookmarkIcon = (
  <path d="M4.5 2h3a1 1 0 0 1 1 1v7L6 8.5 3.5 10V3a1 1 0 0 1 1-1Z" />
);

export default createSvgIcon(BookmarkIcon, "bookmark");
