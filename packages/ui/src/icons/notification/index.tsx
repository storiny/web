"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const NotificationIcon = (
  <path d="M5 3H3.5a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1H8a1 1 0 0 0 1-1V7M7 3.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
);

export default create_svg_icon(NotificationIcon, "notification");
