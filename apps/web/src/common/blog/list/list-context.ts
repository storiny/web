"use client";

import React from "react";

import { BlogProps } from "~/entities/blog";

// Context for individual blog entities.
export const VirtualizedBlogListContext = React.createContext<
  Partial<BlogProps>
>({});
