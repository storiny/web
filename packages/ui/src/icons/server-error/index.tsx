"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const ServerErrorIcon = (
  <path d="M3 6.5h6A1.5 1.5 0 0 0 10.5 5V4A1.5 1.5 0 0 0 9 2.5H3A1.5 1.5 0 0 0 1.5 4v1A1.5 1.5 0 0 0 3 6.5Zm0 0A1.5 1.5 0 0 0 1.5 8v1A1.5 1.5 0 0 0 3 10.5h4.5m-4-6v0m0 4v0m6 2.5v0m0-3v1.5" />
);

export default create_svg_icon(ServerErrorIcon, "server-error");
