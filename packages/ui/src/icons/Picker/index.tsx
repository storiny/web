"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const PickerIcon = (
  <path d="m5.5 3.5 3 3M2 8l5.85-5.85a.5.5 0 0 1 .7 0l1.3 1.3a.5.5 0 0 1 0 .7L4 10H2V8Z" />
);

export default createSvgIcon(PickerIcon, "picker");
