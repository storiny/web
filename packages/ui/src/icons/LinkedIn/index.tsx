"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const LinkedInIcon = (
  <path d="M11.11 0H.9a.87.87 0 0 0-.9.86v10.27c0 .48.4.87.89.87H11.1c.5 0 .89-.39.89-.86V.86c0-.47-.4-.86-.89-.86ZM3.56 10.23H1.78V4.5h1.78v5.73Zm-.89-6.51a1.03 1.03 0 1 1 0-2.07 1.03 1.03 0 0 1 0 2.07Zm7.56 6.5H8.45V7.45c0-.66-.01-1.52-.93-1.52s-1.07.73-1.07 1.47v2.84H4.68V4.5h1.7v.78h.03c.23-.45.82-.93 1.68-.93 1.8 0 2.14 1.2 2.14 2.73v3.15Z" />
);

export default createSvgIcon(LinkedInIcon, "linked-in", { noStroke: true });
