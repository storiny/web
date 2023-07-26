"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const SolidFillIcon = (
  <path d="M1.25 2.3a1.06 1.06 0 0 1 1.06-1.05h7.38a1.06 1.06 0 0 1 1.06 1.06v7.38a1.06 1.06 0 0 1-1.06 1.06H2.31a1.06 1.06 0 0 1-1.06-1.06V2.31Z" />
);

export default createSvgIcon(SolidFillIcon, "solid-fill", { noStroke: true });
