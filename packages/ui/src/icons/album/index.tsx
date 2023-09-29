"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const AlbumIcon = (
  <path d="M6 2v3.5l1-1 1 1V2M2 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Z" />
);

export default create_svg_icon(AlbumIcon, "album");
