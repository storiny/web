"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const StoryIcon = (
  <path d="M8 3h1.5a.49997.49997 0 0 1 .5.5V9a1.00003 1.00003 0 0 1-1 1m0 0a1.00003 1.00003 0 0 1-1-1V2.5a.49997.49997 0 0 0-.5-.5h-5a.49997.49997 0 0 0-.5.5v6A1.50002 1.50002 0 0 0 3.5 10H9ZM4 4h2M4 6h2M4 8h2" />
);

export default createSvgIcon(StoryIcon, "story");
