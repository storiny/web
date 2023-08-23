"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const HorizontalRuleIcon = (
  <path d="M7 1.8v2a.5.5 0 0 0 .5.5h2M7 1.8H3.5a1 1 0 0 0-1 1v2.5M7 1.8l2.5 2.5m0 0v1m0 4v.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-.5m-1-2H3m2.25 0h1.5M9 7.3h1.5" />
);

export default createSvgIcon(HorizontalRuleIcon, "horizontal-rule");
