"use client";

import React from "react";

import { StoryProps } from "~/entities/Story";
import { StorySkeletonProps } from "~/entities/Story/Skeleton";

// Context for individual story entities.
export const VirtualizedStoryListContext = React.createContext<{
  skeletonProps: Partial<StorySkeletonProps>;
  storyProps: Partial<StoryProps>;
}>({ storyProps: {}, skeletonProps: {} });
