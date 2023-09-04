"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const FigureFillIcon = (
  <path d="M2 1.75a.25.25 0 0 0 0 .5h8a.25.25 0 1 0 0-.5H2ZM2 9.75a.25.25 0 0 0 0 .5h8a.25.25 0 1 0 0-.5H2ZM2.6 3.5a.6.6 0 0 0-.6.6v3.8c0 .33.27.6.6.6h6.8a.6.6 0 0 0 .6-.6V4.1a.6.6 0 0 0-.6-.6H2.6Z" />
);

export default createSvgIcon(FigureFillIcon, "figure-fill", { noStroke: true });
