"use client";

import React from "react";

import { ReplyProps } from "~/entities/reply";
import { ReplySkeletonProps } from "~/entities/reply/skeleton";

// Context for individual reply entities.
export const VirtualizedReplyListContext = React.createContext<{
  replyProps: Partial<ReplyProps>;
  skeletonProps: Partial<ReplySkeletonProps>;
}>({ replyProps: {}, skeletonProps: {} });
