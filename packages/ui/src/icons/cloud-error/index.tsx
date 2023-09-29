"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const CloudErrorIcon = (
  <path d="M7.5 9H3.33C2.04 9 1 8 1 6.76a2.29 2.29 0 0 1 2.33-2.24c.2-.88.9-1.6 1.84-1.89a3 3 0 0 1 2.72.5c.74.6 1.08 1.5.88 2.39h.5c.69 0 1.28.4 1.56.98M9.5 8v1.5m0 1.5v0" />
);

export default create_svg_icon(CloudErrorIcon, "cloud-error");
