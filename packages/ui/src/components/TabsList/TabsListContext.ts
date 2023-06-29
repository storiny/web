"use client";

import React from "react";

import { TabsListProps } from "./TabsList.props";

// Context for Tab
export const TabsListContext = React.createContext<Pick<TabsListProps, "size">>(
  {}
);
