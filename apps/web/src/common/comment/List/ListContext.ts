"use client";

import React from "react";

import { CommentProps } from "~/entities/Comment";
import { CommentSkeletonProps } from "~/entities/Comment/Skeleton";

// Context for individual comment entities.
export const VirtualizedCommentListContext = React.createContext<{
  commentProps: Partial<CommentProps>;
  skeletonProps: Partial<CommentSkeletonProps>;
}>({ commentProps: {}, skeletonProps: {} });
