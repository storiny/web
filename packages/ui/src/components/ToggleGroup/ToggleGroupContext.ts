"use client";

import React from "react";

import { ToggleGroupProps } from "./ToggleGroup.props";

// Context for ToggleGroupItem
export const ToggleGroupContext = React.createContext<
  Pick<ToggleGroupProps, "size">
>({});
