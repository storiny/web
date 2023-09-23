"use client";

import React from "react";

import { StoryProps } from "~/entities/story";
import { StorySkeletonProps } from "~/entities/story/skeleton";

// Context for individual story entities.
export const VirtualizedStoryListContext = React.createContext<{
  skeletonProps: Partial<StorySkeletonProps>;
  storyProps: Partial<StoryProps>;
}>({ storyProps: {}, skeletonProps: {} });
