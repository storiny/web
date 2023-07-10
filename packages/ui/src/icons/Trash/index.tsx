"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const TrashIcon = (
  <path d="M2 3.5h8m-5 2v3m2-3v3m-4.5-5 .5 6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-6m-5 0V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5" />
);

export default createSvgIcon(TrashIcon, "trash");
