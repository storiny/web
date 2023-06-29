"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const SearchIcon = (
  <path d="m10.5 10.5-3-3M1.5 5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
);

export default createSvgIcon(SearchIcon, "search");
