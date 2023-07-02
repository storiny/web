"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const MapIcon = (
  <path d="M6 9.25 4.5 8.5m0 0-3 1.5V3.5l3-1.5m0 6.5V2m0 0 3 1.5m0 0 3-1.5v3.75m-3-2.25v2.75M9.5 9v0m1.06 1.06a1.5 1.5 0 1 0-2.12 0c.2.21.56.52 1.06.94.53-.45.88-.76 1.06-.94Z" />
);

export default createSvgIcon(MapIcon, "map");
