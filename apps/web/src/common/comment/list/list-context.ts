"use client";

import React from "react";

import { CommentProps } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";

// Context for individual comment entities.
export const VirtualizedCommentListContext = React.createContext<{
  comment_props: Partial<CommentProps>;
  skeleton_props: Partial<CommentSkeletonProps>;
}>({ comment_props: {}, skeleton_props: {} });
