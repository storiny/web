"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const MapPinIcon = (
  <>
    <path d="M4.5 5.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
    <path d="M8.83 8.33 6.7 10.45a1 1 0 0 1-1.42 0L3.17 8.33a4 4 0 1 1 5.66 0Z" />
  </>
);

export default createSvgIcon(MapPinIcon, "map-icon");
