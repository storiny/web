"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const TwitterIcon = (
  <path d="M3.78 11.19a6.96 6.96 0 0 0 7-7.33A5 5 0 0 0 12 2.6c-.45.2-.93.33-1.41.39.51-.31.9-.8 1.08-1.36-.48.28-1.01.48-1.56.6a2.47 2.47 0 0 0-4.2 2.24A7 7 0 0 1 .84 1.89a2.46 2.46 0 0 0 .76 3.28c-.4-.01-.78-.12-1.12-.3v.03a2.46 2.46 0 0 0 1.98 2.4c-.36.1-.74.11-1.11.04a2.47 2.47 0 0 0 2.3 1.71A4.94 4.94 0 0 1 0 10.08a6.98 6.98 0 0 0 3.78 1.1Z" />
);

export default createSvgIcon(TwitterIcon, "twitter", { noStroke: true });
