"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const AccessibilityIcon = (
  <>
    <path d="M6 4a.25.25 0 1 0 0-.5.25.25 0 0 0 0 .5Z" />
    <path d="m5 8.25 1-1.5m0 0 1 1.5m-1-1.5v-1m0 0 1.5-.5m-1.5.5-1.5-.5M1.5 6a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Zm4.75-2.25a.25.25 0 1 1-.5 0 .25.25 0 0 1 .5 0Z" />
  </>
);

export default createSvgIcon(AccessibilityIcon, "accessibility");
