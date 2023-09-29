"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const FacebookIcon = (
  <path d="M12 6a6 6 0 1 0-6.94 5.93v-4.2H3.54V6h1.52V4.68c0-1.5.9-2.34 2.27-2.34.66 0 1.34.12 1.34.12v1.48h-.75c-.75 0-.98.46-.98.94V6H8.6l-.26 1.73h-1.4v4.2A6 6 0 0 0 12 6Z" />
);

export default create_svg_icon(FacebookIcon, "facebook", { no_stroke: true });
