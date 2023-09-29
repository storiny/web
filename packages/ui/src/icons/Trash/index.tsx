"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const TrashIcon = (
  <path d="M2 3.5h8m-5 2v3m2-3v3m-4.5-5 .5 6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-6m-5 0V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5" />
);

export default create_svg_icon(TrashIcon, "trash");
