"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const HandClickIcon = (
  <path d="M5.5 6V2.25a.75.75 0 0 0-1.5 0V6.5l-.73-.74a.93.93 0 0 0-1.14-.13.75.75 0 0 0-.27 1A97.34 97.34 0 0 0 3.5 9.5l.1.15A3 3 0 0 0 6.1 11H6h1a3 3 0 0 0 3-3V5.75a.75.75 0 1 0-1.5 0m-3 0v-1a.75.75 0 0 1 1.5 0V6m0-.75a.75.75 0 0 1 1.5 0V6m-6-4.5L2 1m0 2.5h-.5m5.5-2 .5-.5m0 2H8" />
);

export default create_svg_icon(HandClickIcon, "hand-click");
