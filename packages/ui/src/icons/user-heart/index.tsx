"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const UserHeartIcon = (
  <path d="M3 10.5v-1a2 2 0 0 1 2-2h.25M4 3.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM9 11l1.68-1.64a1.07 1.07 0 0 0 0-1.54 1.12 1.12 0 0 0-1.57 0l-.1.1-.12-.1a1.12 1.12 0 0 0-1.8.35 1.07 1.07 0 0 0 .23 1.18L9 11Z" />
);

export default create_svg_icon(UserHeartIcon, "user-heart");
