"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const MessagesIcon = (
  <path d="M7 7.5v1a.5.5 0 0 1-.5.5H3l-1.5 1.5v-5A.5.5 0 0 1 2 5h1m7.5 2L9 5.5H5.5A.5.5 0 0 1 5 5V2a.5.5 0 0 1 .5-.5H10a.5.5 0 0 1 .5.5v5Z" />
);

export default createSvgIcon(MessagesIcon, "messages");
