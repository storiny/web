"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const HeartbeatIcon = (
  <path d="M9.75 6.79 6 10.5 4.55 9.07M1.5 5A2.5 2.5 0 0 1 6 3.51a2.5 2.5 0 1 1 3.75 3.28M1.5 6.5h1l1 1.5 1-3L5 6.5h1.5" />
);

export default createSvgIcon(HeartbeatIcon, "heartbeat");
