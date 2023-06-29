"use client";

import React from "react";

import { RadioProps } from "~/components/Radio";

// Context for radio items
export const RadioGroupContext = React.createContext<{
  color?: RadioProps["color"];
  size?: RadioProps["size"];
}>({});
