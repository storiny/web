"use client";

import React from "react";

import { ReplyProps } from "~/entities/reply";
import { ReplySkeletonProps } from "~/entities/reply/skeleton";

// Context for individual reply entities.
export const VirtualizedReplyListContext = React.createContext<{
  reply_props: Partial<ReplyProps>;
  skeleton_props: Partial<ReplySkeletonProps>;
}>({ reply_props: {}, skeleton_props: {} });
