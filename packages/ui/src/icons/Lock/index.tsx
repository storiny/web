"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const LockIcon = (
  <>
    <path d="M2.5 7.13a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-3Z" />
    <path d="M5.5 8.63a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0ZM4 6.13v-2a2 2 0 1 1 4 0v2" />
  </>
);

export default create_svg_icon(LockIcon, "lock");
