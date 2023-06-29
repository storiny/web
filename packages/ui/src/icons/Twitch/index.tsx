"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const TwitchIcon = (
  <>
    <path d="M3 0 .86 2.14v7.72h2.57V12l2.14-2.14H7.3L11.14 6V0H3Zm7.29 5.57L8.57 7.3H6.86l-1.5 1.5V7.3H3.43V.86h6.86v4.71Z" />
    <path d="M9 2.36h-.86v2.57H9V2.36Zm-2.36 0H5.8v2.57h.85V2.36Z" />
  </>
);

export default createSvgIcon(TwitchIcon, "twitch", { noStroke: true });
