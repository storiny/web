"use client";

import React from "react";

import { UserProps } from "~/entities/user";

// Context for individual user entities.
export const VirtualizedUserListContext = React.createContext<
  Partial<UserProps>
>({});
