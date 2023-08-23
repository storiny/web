"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const EmbedIcon = (
  <path d="M8 2.5v2a.5.5 0 0 0 .5.5h2M8 2.5 10.5 5M8 2.5H2.5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5" />
);

export default createSvgIcon(EmbedIcon, "embed");
