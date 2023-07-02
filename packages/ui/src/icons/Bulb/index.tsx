"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const BulbIcon = (
  <path d="M1.5 6H2m4-4.5V2m4 4h.5M2.8 2.8l.35.35M9.2 2.8l-.35.35m-4 5.35h2.3M4.5 8a2.5 2.5 0 1 1 3 0A1.75 1.75 0 0 0 7 9.5a1 1 0 1 1-2 0A1.75 1.75 0 0 0 4.5 8Z" />
);

export default createSvgIcon(BulbIcon, "bulb");
