"use client";

import React from "react";

import { SubscriberProps } from "~/entities/subscriber";

// Context for individual subscriber entities.
export const VirtualizedSubscriberListContext = React.createContext<
  Partial<SubscriberProps>
>({});
