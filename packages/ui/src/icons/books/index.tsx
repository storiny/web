"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const BooksIcon = (
  <path d="M4.5 2.5A.5.5 0 0 0 4 2H3a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5m0-7v7m0-7A.5.5 0 0 1 5 2h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5M2.5 4h2m0 4h2M7 4.5 9 4M8 8l1.96-.49M6.9 2.28 8 2.01c.27-.06.56.1.63.37l1.85 6.71a.51.51 0 0 1-.32.6l-.06.03-1.1.26a.53.53 0 0 1-.63-.36L6.52 2.9a.51.51 0 0 1 .32-.61l.06-.02Z" />
);

export default create_svg_icon(BooksIcon, "books");
