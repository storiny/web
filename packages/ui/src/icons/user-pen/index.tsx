"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const UserPenIcon = (
  <path d="M3 10.5v-1a2 2 0 0 1 2-2h1.75M4 3.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm5.21 4.3a1.05 1.05 0 1 1 1.48 1.49L9 11H7.5V9.5l1.71-1.7Z" />
);

export default create_svg_icon(UserPenIcon, "user-pen");
