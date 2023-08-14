"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const DeviceTabletIcon = (
  <>
    <path d="M2.5 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V2Z" />
    <path d="M5.5 8.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Z" />
  </>
);

export default createSvgIcon(DeviceTabletIcon, "device-tablet");
