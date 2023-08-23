"use client";

import React from "react";

import { createSvgIcon } from "~/utils/createSvgIcon";

const StrikethroughIcon = (
  <path d="M2.5 6h7M8 3.25c-.11-.22-.37-.41-.74-.55-.36-.14-.8-.2-1.26-.2h-.5a1.75 1.75 0 0 0 0 3.5h1a1.75 1.75 0 0 1 0 3.5h-.75c-.45 0-.9-.06-1.26-.2-.37-.14-.63-.33-.74-.55" />
);

export default createSvgIcon(StrikethroughIcon, "strikethrough");
