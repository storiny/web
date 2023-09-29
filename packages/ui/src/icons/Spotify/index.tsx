"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const SpotifyIcon = (
  <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0Zm2.93 8.65a.52.52 0 0 1-.71.2 6.21 6.21 0 0 0-4.97-.5.52.52 0 0 1-.32-1 7.26 7.26 0 0 1 5.8.59c.25.14.34.46.2.7Zm.72-1.82a.52.52 0 0 1-.7.22 8.16 8.16 0 0 0-6.06-.6.52.52 0 0 1-.3-1.01 9.2 9.2 0 0 1 6.83.68c.26.14.36.45.23.7ZM9.9 5.3a.53.53 0 0 1-.24-.05 10.08 10.08 0 0 0-7.12-.73.52.52 0 0 1-.27-1 11.12 11.12 0 0 1 7.86.8.52.52 0 0 1-.23.98Z" />
);

export default create_svg_icon(SpotifyIcon, "spotify", { no_stroke: true });
