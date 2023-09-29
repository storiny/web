"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const MailIcon = (
  <path d="M1.5 3.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1m-9 0v5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-5m-9 0 4.5 3 4.5-3" />
);

export default create_svg_icon(MailIcon, "mail");
