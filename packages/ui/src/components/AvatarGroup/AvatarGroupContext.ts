"use client";

import React from "react";

import { AvatarGroupProps } from "./AvatarGroup.props";

// Context for avatar
export const AvatarGroupContext = React.createContext<{
  size?: AvatarGroupProps["size"];
}>({});
