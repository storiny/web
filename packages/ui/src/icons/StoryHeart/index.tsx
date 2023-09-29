"use client";

import React from "react";

import { create_svg_icon } from "src/utils/create-svg-icon";

const StoryHeartIcon = (
  <path d="M8 3h1.5a.5.5 0 0 1 .5.5v2M8 3v2m0-2v-.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v6A1.5 1.5 0 0 0 3.5 10h1.25M4 4h2M4 6h2M4 8h.5M8 10.75l1.675-1.642a1.0716 1.0716 0 0 0 .0025-1.5355 1.121 1.121 0 0 0-1.5645-.003l-.112.11-.1115-.11a1.121 1.121 0 0 0-1.564-.003 1.0716 1.0716 0 0 0-.003 1.5355L8 10.75Z" />
);

export default create_svg_icon(StoryHeartIcon, "story-heart");
