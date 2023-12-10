"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ConnectionCloseIcon = (
  <path d="m10 8-2 2m-6.5.5 1.25-1.25m6.5-6.5L10.5 1.5M5 5.5l-1 1m2.5.5-1 1M8 8l2 2M3.5 6 6 8.5l-.75.75a1.768 1.768 0 1 1-2.5-2.5L3.5 6Zm5 0L6 3.5l.75-.75a1.768 1.768 0 1 1 2.5 2.5L8.5 6Z" />
);

export default create_svg_icon(ConnectionCloseIcon, "connection-close");
