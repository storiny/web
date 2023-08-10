"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const PasswordIcon = (
  <path d="M6 5v2m-1-.5 2-1m-2 0 2 1M2.5 5v2m-1-.5 2-1m-2 0 2 1m6-1.5v2m-1-.5 2-1m-2 0 2 1" />
);

export default createSvgIcon(PasswordIcon, "password");
