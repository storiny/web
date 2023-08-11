"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const QRCodeIcon = (
  <path d="M3.5 8.5v0m0-5v0m5 0v0m0 3.5H7v1.5M10 7v0m-3 3h1.5m0-1.5H10V10M2 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Zm5 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Zm-5 5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2Z" />
);

export default createSvgIcon(QRCodeIcon, "qrcode");
