"use client";

import React from "react";

import { AvatarGroupProps } from "./avatar-group.props";

// Context for avatar
export const AvatarGroupContext = React.createContext<{
  size?: AvatarGroupProps["size"];
}>({});
