"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const PauseIcon = (
  <path d="M3 3a.5.5 0 0 1 .5-.5h1A.5.5 0 0 1 5 3v6a.5.5 0 0 1-.5.5h-1A.5.5 0 0 1 3 9V3ZM7 3a.5.5 0 0 1 .5-.5h1A.5.5 0 0 1 9 3v6a.5.5 0 0 1-.5.5h-1A.5.5 0 0 1 7 9V3Z" />
);

export default createSvgIcon(PauseIcon, "pause");
