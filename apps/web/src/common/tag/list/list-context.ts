"use client";

import React from "react";

import { TagProps } from "~/entities/tag";

// Context for individual tag entities.
export const VirtualizedTagListContext = React.createContext<Partial<TagProps>>(
  {}
);
