"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const UserIcon = (
  <path d="M3 10.5v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-1-7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
);

export default create_svg_icon(UserIcon, "user");
