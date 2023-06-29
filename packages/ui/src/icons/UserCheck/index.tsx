"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const UserCheckIcon = (
  <path d="M3 10.5v-1a2 2 0 0 1 2-2h2m.5 2 1 1 2-2M4 3.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
);

export default createSvgIcon(UserCheckIcon, "user-check");
