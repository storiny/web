"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const PointIcon = (
  <path d="M6 3.5a2.5 2.5 0 1 1-2.5 2.6v-.2A2.5 2.5 0 0 1 6 3.5Z" />
);

export default createSvgIcon(PointIcon, "point", { noStroke: true });
