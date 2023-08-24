"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CloudSyncingIcon = (
  <path d="M6 9H3.33C2.04 9 1 8 1 6.76a2.29 2.29 0 0 1 2.33-2.24c.2-.88.9-1.6 1.84-1.89a3 3 0 0 1 2.72.5c.74.6 1.08 1.5.88 2.39h.5c.69 0 1.28.4 1.56.99M9.5 11V8m0 0L11 9.5M9.5 8 8 9.5" />
);

export default createSvgIcon(CloudSyncingIcon, "cloud-syncing");
