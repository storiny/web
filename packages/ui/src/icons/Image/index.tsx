"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const ImageIcon = (
  <path d="M1.5 8 4 5.5c.46-.45 1.04-.45 1.5 0L8 8M7 7l.5-.5c.46-.45 1.04-.45 1.5 0L10.5 8m-9-5A1.5 1.5 0 0 1 3 1.5h6A1.5 1.5 0 0 1 10.5 3v6A1.5 1.5 0 0 1 9 10.5H3A1.5 1.5 0 0 1 1.5 9V3Z" />
);

export default createSvgIcon(ImageIcon, "image");
