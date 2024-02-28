"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const PackageIcon = (
  <path d="M10 3.75 6 1.5 2 3.75m8 0v4.5L6 10.5m4-6.75L6 6m0 4.5L2 8.25v-4.5m4 6.75V6M2 3.75 6 6m2-3.38L4 4.88" />
);

export default create_svg_icon(PackageIcon, "package");
