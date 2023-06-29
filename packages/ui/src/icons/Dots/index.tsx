"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const DotsIcon = (
  <path d="M5.5 6a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Zm0 3.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Zm0-7a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Z" />
);

export default createSvgIcon(DotsIcon, "dots");
