"use client";

import React from "react";

import { CommentProps } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";

// Context for individual comment entities.
export const VirtualizedCommentListContext = React.createContext<{
  commentProps: Partial<CommentProps>;
  skeletonProps: Partial<CommentSkeletonProps>;
}>({ commentProps: {}, skeletonProps: {} });
