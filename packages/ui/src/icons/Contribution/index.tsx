"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const ContributionIcon = (
  <path d="M9.75 6.286 6 10 2.25 6.286A2.5001 2.5001 0 1 1 6 3.003a2.4998 2.4998 0 0 1 4.2601.438 2.5003 2.5003 0 0 1 .0569 1.9986 2.5007 2.5007 0 0 1-.567.8494M6 3 4.3533 4.6465a.5.5 0 0 0 0 .707l.2715.2715c.345.345.905.345 1.25 0l.5-.5a1.591 1.591 0 0 1 2.25 0L9.75 6.25m-3.5 1.5 1 1M7.5 6.5l1 1" />
);

export default createSvgIcon(ContributionIcon, "contribution");
