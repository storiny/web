"use client";

import React from "react";

import { TabsListProps } from "./tabs-list.props";

// Context for Tab
export const TabsListContext = React.createContext<Pick<TabsListProps, "size">>(
  {}
);
