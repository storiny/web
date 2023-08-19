"use client";

import React from "react";

import { ReplyProps } from "~/entities/Reply";

// Context for individual reply entities.
export const VirtualizedReplyListContext = React.createContext<{
  replyProps: Partial<ReplyProps>;
}>({ replyProps: {} });
