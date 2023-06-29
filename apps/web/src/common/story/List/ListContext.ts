"use client";

import React from "react";

import { StoryProps } from "~/entities/Story";

// Context for individual story entities.
export const VirtualizedStoryListContext = React.createContext<
  Partial<StoryProps>
>({});
