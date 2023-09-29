"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const EditIcon = (
  <path d="M3.5 3.5H3a1 1 0 0 0-1 1V9a1 1 0 0 0 1 1h4.5a1 1 0 0 0 1-1v-.5m-.5-6L9.5 4m.7-.7a1.05 1.05 0 1 0-1.5-1.5L4.5 6v1.5H6l4.2-4.2Z" />
);

export default create_svg_icon(EditIcon, "edit");
