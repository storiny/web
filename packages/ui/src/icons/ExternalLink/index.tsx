"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const ExternalLinkIcon = (
  <path d="M6 3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6m-3.5.5L10 2m0 0H7.5M10 2v2.5" />
);

export default createSvgIcon(ExternalLinkIcon, "external-link");
