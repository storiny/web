"use client";

import React from "react";

import { RadioProps } from "~/components/Radio";

// Context for radio items
export const RadioGroupContext = React.createContext<{
  autoSize?: RadioProps["autoSize"];
  color?: RadioProps["color"];
  size?: RadioProps["size"];
}>({});
