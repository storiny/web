"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const UserPlusIcon = (
  <path d="M8 9.5h3M9.5 8v3M3 10.5v-1a2 2 0 0 1 2-2h2m-3-4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
);

export default create_svg_icon(UserPlusIcon, "user-plus");
