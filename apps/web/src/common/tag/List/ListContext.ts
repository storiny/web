"use client";

import React from "react";

import { TagProps } from "~/entities/Tag";

// Context for individual tag entities.
export const VirtualizedTagListContext = React.createContext<Partial<TagProps>>(
  {}
);
