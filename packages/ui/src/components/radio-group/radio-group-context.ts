"use client";

import React from "react";

import { RadioProps } from "~/components/radio";

// Context for radio items
export const RadioGroupContext = React.createContext<{
  auto_size?: RadioProps["auto_size"];
  color?: RadioProps["color"];
  size?: RadioProps["size"];
}>({});
