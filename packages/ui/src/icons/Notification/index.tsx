"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const NotificationIcon = (
  <path d="M5 3H3.5a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1H8a1 1 0 0 0 1-1V7M7 3.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
);

export default createSvgIcon(NotificationIcon, "notification");
