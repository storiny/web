"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const CcByIcon = (
  <>
    <path d="M1.5 6a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z" />
    <path d="M5.5 3.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0ZM4.5 6.5V6a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v.5A.5.5 0 0 1 7 7h-.25L6.5 9h-1l-.25-2H5a.5.5 0 0 1-.5-.5Z" />
  </>
);

export default createSvgIcon(CcByIcon, "cc-by");
