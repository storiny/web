"use client";

import React from "react";

import { BlogRequestProps } from "~/entities/blog-request";

// Context for individual blog request entities.
export const VirtualizedBlogRequestListContext = React.createContext<
  Partial<BlogRequestProps>
>({});
