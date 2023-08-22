"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const PhotoEditIcon = (
  <path d="M5.5 10h-2A1.5 1.5 0 0 1 2 8.5v-5A1.5 1.5 0 0 1 3.5 2h5A1.5 1.5 0 0 1 10 3.5v2m-8 2 2-2c.46-.45 1.04-.45 1.5 0L7 7l.5-.5c.16-.15.32-.25.5-.3M9.2 7.8a1.05 1.05 0 1 1 1.48 1.49L9 11H7.5V9.5l1.71-1.7Z" />
);

export default createSvgIcon(PhotoEditIcon, "photo-edit");
