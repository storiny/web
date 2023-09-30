"use client";

import React from "react";

import { StoryProps } from "~/entities/story";
import { StorySkeletonProps } from "~/entities/story/skeleton";

// Context for individual story entities.
export const VirtualizedStoryListContext = React.createContext<{
  skeleton_props: Partial<StorySkeletonProps>;
  story_props: Partial<StoryProps>;
}>({ story_props: {}, skeleton_props: {} });
