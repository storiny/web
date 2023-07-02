"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CategoryIcon = (
  <path d="M2 2.63h3v3H2v-3ZM7 2.63h3v3H7v-3ZM2 7.63h3v3H2v-3ZM7 9.13a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
);

export default createSvgIcon(CategoryIcon, "category");
