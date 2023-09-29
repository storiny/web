"use client";

import React from "react";

import { InputProps } from "./input.props";

// Context for end decorator
export const InputContext = React.createContext<{
  color?: InputProps["color"];
  disabled?: boolean;
  size?: InputProps["size"];
}>({});
