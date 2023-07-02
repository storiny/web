"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const GamepadIcon = (
  <path d="m7 7.5 2.04 2.14A1.15 1.15 0 0 0 11 8.63l-.8-4.12M4 4.5v1M3.5 5h1M7 5h1m-.25-2.5a2.5 2.5 0 0 1 0 5H5L3 9.61A1.15 1.15 0 0 1 1.02 8.6l.82-4.09A2.5 2.5 0 0 1 4.3 2.5h3.45Z" />
);

export default createSvgIcon(GamepadIcon, "gamepad");
