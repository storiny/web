"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const NewsletterIcon = (
  <path d="M5 10.5V7.25A1.75 1.75 0 0 0 3.25 5.5m0 0A1.75 1.75 0 0 0 1.5 7.25v3.25h9v-3a2 2 0 0 0-2-2H3.25ZM6 5.5v-4h2l1 1-1 1H6m-3 4h.5" />
);

export default create_svg_icon(NewsletterIcon, "newsletter");
