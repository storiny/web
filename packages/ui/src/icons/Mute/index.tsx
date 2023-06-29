"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const MuteIcon = (
  <path d="m8 5 2 2m0-2L8 7m-5 .5H2a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5h1l1.75-2.25a.4.4 0 0 1 .75.25v7a.4.4 0 0 1-.75.25L3 7.5Z" />
);

export default createSvgIcon(MuteIcon, "mute");
