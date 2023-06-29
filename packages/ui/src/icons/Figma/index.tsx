"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const FigmaIcon = (
  <path
    d="M4.08 0h3.84a2.16 2.16 0 0 1 .99 4.08 2.16 2.16 0 1 1-2.67 3.28v2.48a2.16 2.16 0 1 1-3.15-1.92 2.16 2.16 0 0 1 0-3.84A2.16 2.16 0 0 1 4.08 0ZM2.4 2.16c0-.93.75-1.68 1.68-1.68h1.68v3.36H4.08c-.93 0-1.68-.75-1.68-1.68Zm3.36 3.82a2.17 2.17 0 0 0 0 .04v1.66H4.08a1.68 1.68 0 0 1 0-3.36h1.68v1.66Zm.48.04v-.04c.01-.92.76-1.66 1.67-1.66h.01a1.68 1.68 0 1 1-1.68 1.7Zm.32-1.7c-.12.1-.22.2-.32.32v-.32h.32Zm1.37-.48H6.24V.48h1.68a1.68 1.68 0 0 1 0 3.36ZM4.08 8.16a1.68 1.68 0 1 0 1.68 1.68V8.16H4.08Z"
    fillRule="evenodd"
  />
);

export default createSvgIcon(FigmaIcon, "figma", { noStroke: true });
