"use client";

import React from "react";

import { ToggleGroupProps } from "./toggle-group.props";

// Context for ToggleGroupItem
export const ToggleGroupContext = React.createContext<
  Pick<ToggleGroupProps, "size">
>({});
