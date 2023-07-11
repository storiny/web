"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const RotationIcon = (
  <path d="M6 12A6 6 0 1 0 6 0a6 6 0 0 0 0 12Zm0-.9A5.1 5.1 0 0 1 5.4.93V6.6h1.2V.93A5.1 5.1 0 0 1 6 11.1Z" />
);

export default createSvgIcon(RotationIcon, "rotation");
